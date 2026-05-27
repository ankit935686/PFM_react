import { useCallback, useMemo, useState } from 'react';
import api from '../lib/api';

const STORAGE_KEY = 'fintrack_copilot_sessions_v1';

const nowIso = () => new Date().toISOString();

const makeId = () => `local-${Math.random().toString(36).slice(2, 10)}`;

const readSessions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistSessions = (sessions) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    return null;
  }
};

const sortSessions = (sessions) =>
  [...sessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

export const useCopilotChat = ({ currentUser }) => {
  const [sessions, setSessions] = useState(() => sortSessions(readSessions()));
  const [activeSessionId, setActiveSessionId] = useState(() => readSessions()?.[0]?.id || null);
  const [sending, setSending] = useState(false);
  const [provider, setProvider] = useState(null);

  const save = useCallback((next) => {
    const sorted = sortSessions(next);
    setSessions(sorted);
    persistSessions(sorted);
  }, []);

  const createSession = useCallback(() => {
    const id = makeId();
    const session = {
      id,
      title: 'New Copilot Chat',
      pinned: false,
      updatedAt: nowIso(),
      messages: [],
    };
    const next = [session, ...sessions];
    save(next);
    setActiveSessionId(id);
    return session;
  }, [save, sessions]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  const upsertSession = useCallback((sessionId, updater, fallbackSession = null) => {
    let nextSessions = null;
    setSessions((prev) => {
      const exists = prev.some((s) => s.id === sessionId);
      const base = exists
        ? prev
        : [
            fallbackSession || {
              id: sessionId,
              title: 'New Copilot Chat',
              pinned: false,
              updatedAt: nowIso(),
              messages: [],
            },
            ...prev,
          ];

      const updated = base.map((s) => {
        if (s.id !== sessionId) return s;
        const next = updater(s);
        return { ...next, updatedAt: nowIso() };
      });
      nextSessions = sortSessions(updated);
      persistSessions(nextSessions);
      return nextSessions;
    });
    return nextSessions;
  }, []);

  const renameAndRetargetSession = useCallback(
    ({ fromId, toId, titleHint }) => {
      const next = sessions.map((s) => {
        if (s.id !== fromId) return s;
        return {
          ...s,
          id: toId || s.id,
          title:
            s.title === 'New Copilot Chat'
              ? String(titleHint || 'Financial Copilot Chat').slice(0, 64)
              : s.title,
          updatedAt: nowIso(),
        };
      });
      save(next);
      if (activeSessionId === fromId && toId && toId !== fromId) {
        setActiveSessionId(toId);
      }
    },
    [activeSessionId, save, sessions]
  );

  const togglePin = useCallback(
    (sessionId) => {
      const next = sessions.map((s) => (s.id === sessionId ? { ...s, pinned: !s.pinned } : s));
      save(next);
    },
    [save, sessions]
  );

  const deleteSession = useCallback(
    (sessionId) => {
      const next = sessions.filter((s) => s.id !== sessionId);
      save(next);
      if (activeSessionId === sessionId) {
        setActiveSessionId(next[0]?.id || null);
      }
    },
    [activeSessionId, save, sessions]
  );

  const sendMessage = useCallback(
    async ({ text, forceSessionId = null, reusePrompt = null }) => {
      if (!currentUser?.uid || !String(text || '').trim() || sending) return;
      setSending(true);

      const base = forceSessionId
        ? sessions.find((s) => s.id === forceSessionId) || createSession()
        : activeSession || createSession();
      const localSessionId = base.id;

      const userMessage = {
        id: makeId(),
        role: 'user',
        text: String(text).trim(),
        createdAt: nowIso(),
      };

      upsertSession(
        localSessionId,
        (s) => ({
          ...s,
          title: s.title === 'New Copilot Chat' ? String(text).trim().slice(0, 64) : s.title,
          messages: [...s.messages, userMessage],
        }),
        base
      );

      try {
        const token = await currentUser.getIdToken();
        const headers = {
          Authorization: `Bearer ${token}`,
          'x-firebase-uid': currentUser.uid,
          'x-firebase-email': currentUser.email || '',
        };
        const response = await api.post(
          '/api/copilot/chat',
          {
            message: reusePrompt || text,
            sessionId: localSessionId.startsWith('local-') ? undefined : localSessionId,
          },
          { headers }
        );
        const payload = response.data || {};
        const assistantResponse = payload.response || {};

        const assistantMessage = {
          id: makeId(),
          role: 'assistant',
          text: assistantResponse.text || 'I am ready with your analysis.',
          response: assistantResponse,
          provider: payload.provider || null,
          createdAt: nowIso(),
          contextMode: payload.contextMode || null,
          classification: payload.classification || null,
          sourcePrompt: String(text).trim(),
        };

        const finalSessionId = payload.sessionId || localSessionId;
        if (finalSessionId !== localSessionId) {
          renameAndRetargetSession({
            fromId: localSessionId,
            toId: finalSessionId,
            titleHint: text,
          });
        }

        const targetId = finalSessionId;
        upsertSession(targetId, (s) => ({
          ...s,
          messages: [...s.messages, assistantMessage],
        }));
        setProvider(payload.provider || null);
      } catch (error) {
        const assistantError = {
          id: makeId(),
          role: 'assistant',
          text: error?.response?.data?.message || 'Copilot could not process the request right now.',
          error: true,
          createdAt: nowIso(),
          sourcePrompt: String(text).trim(),
        };
        upsertSession(localSessionId, (s) => ({
          ...s,
          messages: [...s.messages, assistantError],
        }));
      } finally {
        setSending(false);
      }
    },
    [
      activeSession,
      createSession,
      currentUser,
      renameAndRetargetSession,
      sending,
      sessions,
      upsertSession,
    ]
  );

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    createSession,
    togglePin,
    deleteSession,
    sendMessage,
    sending,
    provider,
  };
};
