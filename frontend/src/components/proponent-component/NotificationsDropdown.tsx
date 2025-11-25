import React from "react";
import { FaTimes } from 'react-icons/fa';

interface Notification {
  id: string;
  title: string;
  time: string;
  read: boolean;
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  notifications: Notification[];
  unreadCount: number;
  onClose: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onViewAll: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  notifications,
  unreadCount,
  onClose,
  onMarkAllRead,
  onMarkRead,
  onViewAll
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div className="text-sm font-semibold text-gray-800">Notifications</div>
        <div className="flex items-center gap-2">
          <button
            onClick={onMarkAllRead}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Mark all read
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Close notifications"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto">
        {notifications.length === 0 && (
          <div className="p-4 text-sm text-gray-500 text-center">No notifications</div>
        )}
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3 transition-colors ${
              notification.read ? 'bg-white' : 'bg-gray-50'
            }`}
            onClick={() => onMarkRead(notification.id)}
          >
            <div 
              className="w-2.5 h-2.5 mt-1 rounded-full flex-shrink-0" 
              style={{ background: notification.read ? 'transparent' : '#C8102E' }} 
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-800 line-clamp-2">{notification.title}</div>
              <div className="text-xs text-gray-500 mt-1">{notification.time}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 border-t border-gray-100 text-center">
        <button
          onClick={onViewAll}
          className="text-sm text-[#C8102E] font-medium hover:text-[#a50e26] transition-colors"
        >
          View all
        </button>
      </div>
    </div>
  );
};

export default NotificationsDropdown;