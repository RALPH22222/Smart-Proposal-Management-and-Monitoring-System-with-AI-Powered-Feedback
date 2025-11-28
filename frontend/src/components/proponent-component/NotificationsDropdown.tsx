import React from "react";
import { FaTimes, FaCheckDouble } from 'react-icons/fa';

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
  onClose,
  onMarkAllRead,
  onMarkRead,
  onViewAll
}) => {
  if (!isOpen) return null;

  return (
    // FIXED: Changed anchor from 'right' to 'left' for mobile to prevent cut-off
    // left-0 (mobile): Anchors left edge of dropdown to left edge of bell (expands right)
    // sm:left-auto sm:right-0 (desktop): Anchors right edge to right edge of bell (expands left)
    <div className="absolute top-full mt-3 z-50 transform transition-all 
                    left-0 sm:left-auto sm:right-0 
                    w-[85vw] sm:w-80 max-w-[360px] 
                    bg-white rounded-xl shadow-2xl border border-gray-100 
                    origin-top-left sm:origin-top-right">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <div className="flex items-center gap-2">
           <span className="text-sm font-bold text-gray-800">Notifications</span>
           {notifications.some(n => !n.read) && (
             <span className="bg-[#C8102E] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
               New
             </span>
           )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onMarkAllRead}
            className="text-xs font-medium text-[#C8102E] hover:text-[#a50e26] transition-colors flex items-center gap-1"
            title="Mark all as read"
          >
            <FaCheckDouble className="text-[10px]" />
            <span className="hidden sm:inline">Mark all read</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close notifications"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
             <div className="bg-gray-100 p-3 rounded-full mb-2">
                <FaCheckDouble className="text-gray-400" />
             </div>
            <p className="text-sm text-gray-500 font-medium">No new notifications</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
          </div>
        )}
        
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`group relative px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3 transition-all border-b border-gray-50 last:border-0 ${
              notification.read ? 'bg-white opacity-70 hover:opacity-100' : 'bg-blue-50/30'
            }`}
            onClick={() => onMarkRead(notification.id)}
          >
            {/* Status Dot */}
            <div className="mt-1.5 flex-shrink-0">
               <div 
                  className={`w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm transition-colors ${
                      notification.read ? 'bg-gray-200' : 'bg-[#C8102E]'
                  }`}
               />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${notification.read ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                  {notification.title}
              </p>
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                 {notification.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
        <button
          onClick={onViewAll}
          className="w-full py-2 text-sm text-gray-700 font-medium hover:bg-white hover:text-[#C8102E] hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-gray-200"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationsDropdown;