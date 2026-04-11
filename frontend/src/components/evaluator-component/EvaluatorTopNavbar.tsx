import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from "../../context/NotificationContext";
import NotificationsDropdown from "../proponent-component/NotificationsDropdown";
import { formatDateTime } from "../../utils/date-formatter";

interface EvaluatorTopNavbarProps {
  onPageChange: (page: string) => void;
}

const EvaluatorTopNavbar: React.FC<EvaluatorTopNavbarProps> = ({ onPageChange }) => {
  const { notifications: rawNotifs, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dropdownNotifications = rawNotifs.map((n) => ({
    id: String(n.id),
    title: n.message,
    time: formatDateTime(n.created_at),
    read: n.is_read,
    link: n.link,
  }));

  return (
    <header className="sticky top-0 z-30 flex items-center justify-end px-4 sm:px-6 py-2 sm:py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative flex items-center h-full" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20"
          >
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#C8102E] rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="absolute right-0 top-full mt-2 lg:mt-3">
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
             />
          </div>
        </div>
      </div>
    </header>
  );
};

export default EvaluatorTopNavbar;
