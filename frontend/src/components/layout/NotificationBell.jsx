import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, CheckCheck, CircleAlert, CircleCheck, CircleDashed, IndianRupee } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const STORAGE_PREFIX = 'pfm-notifications-read';

const severityRank = {
  critical: 0,
  warning: 1,
  success: 2,
  info: 3,
};

const NotificationBell = ({ userId, userLabel }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [readMap, setReadMap] = useState({});
  const [notifications, setNotifications] = useState([]);
  const panelRef = useRef(null);

  const storageKey = `${STORAGE_PREFIX}:${userId || 'guest'}`;

  const getAuthHeaders = async () => {
    if (!currentUser) return {};
    const token = await currentUser.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      'x-firebase-uid': currentUser.uid,
      'x-firebase-email': currentUser.email || '',
      'x-firebase-name': currentUser.displayName || '',
    };
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setReadMap(raw ? JSON.parse(raw) : {});
    } catch (_error) {
      setReadMap({});
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(readMap));
    } catch (_error) {
      // ignore storage issues
    }
  }, [readMap, storageKey]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      if (!currentUser?.uid) {
        if (isMounted) setNotifications([]);
        return;
      }

      try {
        const headers = await getAuthHeaders();
        const [calendarResponse, groupResponse] = await Promise.all([
          api.get('/api/calendar/notifications?daysAhead=5', { headers }),
          api.get('/api/groups/notifications', { headers }),
        ]);
        const calendarItems = (calendarResponse.data?.notifications || []).map((item) => ({
          ...item,
          feature: item.type === 'reminder_due' ? 'Reminder' : 'Goal',
          source: 'calendar',
        }));
        const groupItems = (groupResponse.data?.notifications || []).map((item) => ({
          ...item,
          id: `group-${item._id}`,
          title: item.title,
          description: item.description,
          date: item.createdAt,
          severity: item.type === 'you_owe' ? 'critical' : item.type === 'you_are_owed' ? 'success' : 'info',
          feature: 'Group',
          source: 'group',
          groupId: item.groupId,
          rawId: item._id,
          read: item.read,
        }));
        const items = [...calendarItems, ...groupItems];
        if (isMounted) {
          setNotifications(items.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]));
        }
      } catch (_error) {
        if (isMounted) setNotifications([]);
      }
    };

    loadNotifications();
    const timer = setInterval(loadNotifications, 60000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [currentUser]);

  const unreadCount = useMemo(() => {
    return notifications.reduce((count, item) => {
      if (item.source === 'group') return item.read ? count : count + 1;
      return readMap[item.id] ? count : count + 1;
    }, 0);
  }, [notifications, readMap]);

  const markAllRead = () => {
    const next = { ...readMap };
    notifications.forEach((item) => {
      next[item.id] = true;
    });
    setReadMap(next);
  };

  const markCalendarNotificationRead = (id) => {
    setReadMap((current) => ({
      ...current,
      [id]: true,
    }));
  };

  const markGroupNotificationRead = async (rawId) => {
    try {
      const headers = await getAuthHeaders();
      await api.put(`/api/groups/notifications/${rawId}/read`, {}, { headers });
      setNotifications((current) => current.map((item) => (item.rawId === rawId ? { ...item, read: true } : item)));
    } catch (_error) {
      // ignore
    }
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical') return <CircleAlert size={15} className="notify-dot notify-dot-critical" />;
    if (severity === 'warning') return <CircleDashed size={15} className="notify-dot notify-dot-warning" />;
    if (severity === 'success') return <CircleCheck size={15} className="notify-dot notify-dot-success" />;
    return <IndianRupee size={15} className="notify-dot notify-dot-info" />;
  };

  const openOnCalendar = (item) => {
    if (item.source === 'group') {
      if (!item.read && item.rawId) {
        markGroupNotificationRead(item.rawId);
      }
      if (item.groupId) {
        navigate(`/groups/${item.groupId}`);
      } else {
        navigate('/groups');
      }
      setIsOpen(false);
      return;
    }
    const dateKey = item?.date ? new Date(item.date).toISOString().slice(0, 10) : '';
    if (!dateKey) return;
    markCalendarNotificationRead(item.id);
    navigate(`/calendar?date=${dateKey}`);
    setIsOpen(false);
  };

  const visibleNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (item.source === 'group') return !item.read;
      return !readMap[item.id];
    });
  }, [notifications, readMap]);

  return (
    <div className="notify-wrap" ref={panelRef}>
      <button
        className={`icon-btn notify-trigger ${isOpen ? 'notify-open' : ''}`}
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {unreadCount > 0 ? <BellRing size={18} /> : <Bell size={18} />}
        {unreadCount > 0 && <span className="notify-badge">{Math.min(unreadCount, 99)}</span>}
      </button>

      {isOpen && (
        <section className="notify-panel" role="dialog" aria-label="Notifications panel">
          <header className="notify-header">
            <div>
              <h3>Notifications</h3>
              <p>{userLabel ? `For ${userLabel}` : 'Date-based reminders and goal alerts'}</p>
            </div>
            <button className="notify-read-all" type="button" onClick={markAllRead}>
              <CheckCheck size={14} />
              Mark all read
            </button>
          </header>

          <div className="notify-list">
            {!visibleNotifications.length && <p className="notify-empty">No notifications right now.</p>}
            {visibleNotifications.map((item) => {
              const isRead = item.source === 'group' ? Boolean(item.read) : Boolean(readMap[item.id]);
              return (
                <article
                  key={item.id}
                  className={`notify-item notify-${item.severity} ${isRead ? 'notify-read' : ''}`}
                >
                  <div className="notify-title-row">
                    <span className="notify-icon">{getSeverityIcon(item.severity)}</span>
                    <h4>{item.title}</h4>
                    {!isRead && <span className="notify-unread" aria-label="Unread" />}
                  </div>
                  <p>{item.description}</p>
                  <span className="notify-feature">{item.feature}</span>
                  <button
                    type="button"
                    className="mt-2 mr-2 rounded-md border border-[#374151] px-2 py-1 text-xs text-slate-200"
                    onClick={() => {
                      if (item.source === 'group') {
                        if (item.rawId) markGroupNotificationRead(item.rawId);
                        return;
                      }
                      markCalendarNotificationRead(item.id);
                    }}
                    disabled={isRead}
                  >
                    Mark as read
                  </button>
                  <button
                    type="button"
                    className="mt-2 rounded-md border border-[#374151] px-2 py-1 text-xs text-slate-200"
                    onClick={() => openOnCalendar(item)}
                  >
                    Open in Calendar
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default NotificationBell;
