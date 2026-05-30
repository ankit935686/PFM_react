import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Loader2, Menu, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCopilotChat } from '../hooks/useCopilotChat';
import CopilotHistorySidebar from '../components/copilot/CopilotHistorySidebar';
import MessageBubble from '../components/copilot/MessageBubble';
import StructuredResponse from '../components/copilot/StructuredResponse';

const quickPrompts = [
  'Analyze my savings trend and suggest improvements.',
  'Based on my profile, should I prioritize debt or investing?',
  'Review my budget risk areas for this month.',
  'Explain ETFs in simple terms and how they fit my cashflow.',
  'What action items should I do this week for better financial health?',
];

const MotionButton = motion.button;
const MotionDiv = motion.div;

const TypingRow = () => (
  <div className="inline-flex items-center gap-2 rounded-xl border border-[#E8EAF6] bg-[#F8F9FF] px-3 py-2 text-xs text-[#6B7280]">
    <Loader2 size={12} className="animate-spin" />
    Copilot is reasoning...
  </div>
);

const CopilotPage = () => {
  const { currentUser } = useAuth();
  const {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createSession,
    togglePin,
    deleteSession,
    sendMessage,
    sending,
    provider,
  } = useCopilotChat({ currentUser });

  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const textareaRef = useRef(null);

  const filteredSessions = useMemo(() => {
    const needle = search.toLowerCase().trim();
    if (!needle) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(needle));
  }, [search, sessions]);

  const visibleMessages = activeSession?.messages || [];

  const handleSend = async () => {
    const text = query.trim();
    if (!text) return;
    setQuery('');
    if (textareaRef.current) textareaRef.current.style.height = '44px';
    await sendMessage({ text });
  };

  const onTextAreaInput = (event) => {
    const node = event.target;
    node.style.height = '44px';
    node.style.height = `${Math.min(160, node.scrollHeight)}px`;
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text || ''));
    } catch {
      return null;
    }
  };

  const handleRegenerate = async (message) => {
    const prompt = message?.sourcePrompt || visibleMessages.slice().reverse().find((m) => m.role === 'user')?.text;
    if (!prompt) return;
    await sendMessage({ text: prompt, reusePrompt: prompt });
  };

  return (
    <section className="copilot-page relative min-h-[calc(100vh-120px)] overflow-hidden rounded-2xl border border-[#E8EAF6] bg-[#F7F8FC] shadow-[0_20px_40px_-24px_rgba(30,30,45,0.25)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(123,97,255,0.12),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(110,198,230,0.12),transparent_36%),linear-gradient(180deg,#F8F9FF,#F2F4FF)]" />
      <div className="relative grid min-h-[calc(100vh-120px)] grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="hidden xl:block">
          <CopilotHistorySidebar
            sessions={filteredSessions}
            search={search}
            setSearch={setSearch}
            activeSessionId={activeSessionId}
            onSelect={setActiveSessionId}
            onCreate={createSession}
            onPin={togglePin}
            onDelete={deleteSession}
          />
        </div>

        <div className="flex min-w-0 flex-col">
          <header className="flex items-center justify-between border-b border-[#E8EAF6] bg-white/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8EAF6] bg-white text-[#5B5BD6] xl:hidden"
                onClick={() => setMobileHistoryOpen(true)}
              >
                <Menu size={16} />
              </button>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D9DCFF] bg-[#EEF0FF] text-[#5B5BD6]">
                <Bot size={16} />
              </span>
              <div>
                <h1 className="text-sm font-semibold text-[#1E1E2D]">AI Financial Copilot</h1>
                <p className="text-xs text-[#7D8597]">Conversational financial workspace</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8EAF6] bg-white px-3 py-1 text-xs text-[#5B5BD6]">
              <Sparkles size={12} />
              {provider ? `Provider: ${provider}` : 'Provider: Auto'}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {visibleMessages.length === 0 ? (
              <div className="mx-auto grid w-full max-w-5xl gap-4">
                <div className="rounded-2xl border border-[#E8EAF6] bg-white p-6">
                  <h2 className="text-xl font-semibold text-[#1E1E2D]">Start a premium Copilot thread</h2>
                  <p className="mt-2 max-w-2xl text-sm text-[#6B7280]">
                    Ask portfolio, savings, budgeting, investment, or general finance questions. The response layout adapts by intent and context mode.
                  </p>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        setQuery(prompt);
                        requestAnimationFrame(() => textareaRef.current?.focus());
                      }}
                      className="rounded-xl border border-[#E8EAF6] bg-white p-3 text-left text-sm text-[#374151] transition hover:-translate-y-0.5 hover:bg-[#F8F9FF]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto grid w-full max-w-5xl gap-3">
                {visibleMessages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    <MessageBubble message={message} onCopy={handleCopy} onRegenerate={handleRegenerate} />
                    {message.role === 'assistant' && message.response ? (
                      <StructuredResponse response={message.response} contextMode={message.contextMode} />
                    ) : null}
                  </div>
                ))}
                {sending ? <TypingRow /> : null}
              </div>
            )}
          </div>

          <footer className="border-t border-[#E8EAF6] bg-white/90 p-3">
            <div className="mx-auto grid w-full max-w-5xl gap-2">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="rounded-full border border-[#E8EAF6] bg-[#F8F9FF] px-3 py-1 text-xs text-[#5B5BD6] hover:bg-[#EEF0FF]"
                    onClick={() => setQuery(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onInput={onTextAreaInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="Ask about portfolio growth, savings strategy, ETF education, or market-aware planning..."
                  className="min-h-[44px] flex-1 resize-none rounded-xl border border-[#E8EAF6] bg-white px-3 py-2 text-sm text-[#1E1E2D] placeholder:text-[#9CA3AF] focus:border-[#D9DCFF] focus:outline-none"
                />
                <MotionButton
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  disabled={sending || !query.trim()}
                  onClick={handleSend}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#D9DCFF] bg-gradient-to-r from-[#5B5BD6] to-[#7C6EF2] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send
                </MotionButton>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <AnimatePresence>
        {mobileHistoryOpen ? (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 xl:hidden"
            onClick={() => setMobileHistoryOpen(false)}
          >
            <MotionDiv
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="h-full w-[88%] max-w-[330px]"
              onClick={(e) => e.stopPropagation()}
            >
              <CopilotHistorySidebar
                sessions={filteredSessions}
                search={search}
                setSearch={setSearch}
                activeSessionId={activeSessionId}
                onSelect={(id) => {
                  setActiveSessionId(id);
                  setMobileHistoryOpen(false);
                }}
                onCreate={() => {
                  createSession();
                  setMobileHistoryOpen(false);
                }}
                onPin={togglePin}
                onDelete={deleteSession}
              />
            </MotionDiv>
          </MotionDiv>
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default CopilotPage;
