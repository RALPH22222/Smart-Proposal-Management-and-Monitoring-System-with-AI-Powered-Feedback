import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationsDropdown from '../proponent-component/NotificationsDropdown';
import { formatDateTime } from '../../utils/date-formatter';

interface AdminFloatingNotificationProps {
  onPageChange: (page: string) => void;
}

const AdminFloatingNotification: React.FC<AdminFloatingNotificationProps> = ({ onPageChange }) => {
  const { notifications: rawNotifs, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dropdownNotifications = rawNotifs.map((n) => ({
    id: String(n.id),
    title: n.message,
    time: formatDateTime(n.created_at),
    read: n.is_read,
    link: n.link,
  }));

  return (
    <div className="fixed bottom-6 right-6 z-30" ref={notifRef}>
      <button
        type="button"
        onClick={() => setNotificationsOpen(!notificationsOpen)}
        className={`relative p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center group ${
          notificationsOpen
            ? 'bg-[#C8102E] text-white rotate-12'
            : 'bg-white text-slate-600 hover:text-[#C8102E]'
        }`}
        aria-label="Notifications"
        aria-expanded={notificationsOpen}
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 && !notificationsOpen ? 'animate-bounce' : ''}`} />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-6 w-6 bg-[#C8102E] text-white text-[10px] font-bold items-center justify-center border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}

        {!notificationsOpen && (
          <div className="absolute right-full mr-4 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
            Notifications
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-slate-800" />
          </div>
        )}
      </button>

      <div className="absolute right-0 bottom-full mb-4">
        <NotificationsDropdown
          isOpen={notificationsOpen}
          notifications={dropdownNotifications}
          unreadCount={unreadCount}
          onClose={() => setNotificationsOpen(false)}
          onMarkAllRead={markAllAsRead}
          onMarkRead={(id) => markAsRead([Number(id)])}
          onViewAll={() => setNotificationsOpen(false)}
          onNavigate={(link) => {
            onPageChange(link);
            setNotificationsOpen(false);
          }}
          position="bottom"
        />
      </div>
    </div>
  );
};

export default AdminFloatingNotification;
