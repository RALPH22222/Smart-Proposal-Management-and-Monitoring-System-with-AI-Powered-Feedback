import { useState } from "react";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  Trash2,
  DollarSign,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Sidebar from "../../../components/EvaluatorSide";

const typeConfig = {
  success: {
    icon: CheckCircle,
    bgColor: "bg-green-50",
    colors: "text-green-600 border-green-600",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-50",
    colors: "text-yellow-600 border-yellow-600",
  },
};

const categoryIcons = {
  "Funding Accepted": DollarSign,
  "Funding Approved": Users,
  "Funding Rejected": Trash2,
};

export default function Notifications() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      text: "AI-Powered Educational Assessment System",
      time: "30m ago",
      type: "success",
      read: false,
      description:
        "Evaluator-endorsed proposal by Jasmine Anderson has been ACCEPTED for funding consideration.",
      category: "Funding Accepted",
    },
    {
      id: 2,
      text: "Sustainable Agriculture IoT Network",
      time: "1h ago",
      type: "success",
      read: false,
      description:
        "Evaluator-endorsed proposal by Michael Chen has been FUNDED and approved for implementation.",
      category: "Funding Approved",
    },
    {
      id: 3,
      text: "Blockchain Healthcare Records System",
      time: "2h ago",
      type: "warning",
      read: false,
      description:
        "Evaluator-endorsed proposal by Emily Rodriguez has been REJECTED. Reason: Security compliance concerns.",
      category: "Funding Rejected",
    },
    {
      id: 4,
      text: "Renewable Energy Storage Optimization",
      time: "4h ago",
      type: "success",
      read: true,
      description:
        "Evaluator-endorsed proposal by James Wilson has been ACCEPTED for funding consideration.",
      category: "Funding Accepted",
    },
    {
      id: 5,
      text: "Marine Biodiversity Conservation Platform",
      time: "6h ago",
      type: "success",
      read: true,
      description:
        "Evaluator-endorsed proposal by Maria Santos has been FUNDED and approved for implementation.",
      category: "Funding Approved",
    },
    {
      id: 6,
      text: "Smart Traffic Management System",
      time: "8h ago",
      type: "warning",
      read: false,
      description:
        "Evaluator-endorsed proposal by Robert Kim has been REJECTED. Reason: Budget allocation constraints.",
      category: "Funding Rejected",
    },
    {
      id: 7,
      text: "Advanced Materials Research",
      time: "1d ago",
      type: "warning",
      read: true,
      description:
        "Evaluator-endorsed proposal has been REJECTED. Reason: Overlapping with existing projects.",
      category: "Funding Rejected",
    },
    {
      id: 8,
      text: "Climate Change Modeling",
      time: "2d ago",
      type: "success",
      read: true,
      description:
        "Evaluator-endorsed proposal has been APPROVED for implementation.",
      category: "Funding Approved",
    },
  ]);

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = notifications.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 h-screen flex">
      {/* Sidebar on the left */}
      <Sidebar />

      {/* Main content on the right */}
      <div className="flex-1 flex flex-col p-8 gap-6">
        {/* Header */}
        <header className="pb-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight flex items-center gap-3">
                <Bell className="h-6 w-6" aria-hidden="true" />
                Evaluator Notifications
                {unreadCount > 0 && (
                  <span className="bg-[#C8102E] text-white text-xs font-medium px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                Research updates, approvals, and system alerts from your
                Evaluator dashboard.
              </p>
            </div>
          </div>
        </header>

        {/* Quick Actions */}
        {unreadCount > 0 && (
          <section className="mb-6 flex-shrink-0">
            <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    You have {unreadCount} unread notification
                    {unreadCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  onClick={markAllAsRead}
                  className="text-[#C8102E] hover:text-[#A00E26] font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-opacity-50 rounded px-2 py-1 text-xs cursor-pointer"
                  aria-label={`Mark all ${unreadCount} notifications as read`}
                >
                  Mark all as read
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Notifications List */}
        <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#C8102E]" />
                Recent Notifications
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info className="w-4 h-4" />
                <span>{notifications.length} total notifications</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-slate-400" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No notifications
                </h3>
                <p className="text-slate-500">
                  You're all caught up! Check back later for new updates.
                </p>
              </div>
            ) : (
              <ul
                role="list"
                aria-label="Notifications"
                className="divide-y divide-slate-100"
              >
                {paginatedNotifications.map((notification) => {
                  const config =
                    typeConfig[notification.type as keyof typeof typeConfig];
                  const IconComponent = config.icon;
                  const CategoryIcon =
                    categoryIcons[
                      notification.category as keyof typeof categoryIcons
                    ] || Info;

                  return (
                    <li
                      key={notification.id}
                      className={`relative flex items-start gap-3 p-4 transition-colors duration-200 hover:bg-slate-50 group ${
                        !notification.read ? "bg-blue-50/30" : ""
                      }`}
                      role="listitem"
                    >
                      {!notification.read && (
                        <div
                          className="absolute left-2 top-6 w-2 h-2 bg-[#C8102E] rounded-full"
                          aria-label="Unread notification"
                        />
                      )}
                      <div
                        className={`flex-shrink-0 p-2 rounded-full ${config.bgColor} ml-2`}
                      >
                        <IconComponent
                          className="h-3 w-3 text-current"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-current border-opacity-20 ${config.colors}`}
                              >
                                {notification.type.charAt(0).toUpperCase() +
                                  notification.type.slice(1)}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                <CategoryIcon
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                                {notification.category}
                              </span>
                              <time
                                className="text-xs text-slate-500 tabular-nums"
                                dateTime={notification.time}
                              >
                                {notification.time}
                              </time>
                            </div>

                            <h3
                              className={`text-sm font-semibold mb-1 group-hover:text-[#C8102E] transition-colors duration-200 ${
                                notification.read
                                  ? "text-slate-700"
                                  : "text-slate-900"
                              }`}
                            >
                              {notification.text}
                            </h3>

                            <p className="text-xs text-slate-600 leading-relaxed text-pretty">
                              {notification.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer"
                              aria-label={`View notification: ${notification.text}`}
                              title="View details"
                            >
                              <Eye className="h-3 w-3" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer"
                              aria-label={`Delete notification: ${notification.text}`}
                              title="Delete notification"
                            >
                              <Trash2 className="h-3 w-3" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Pagination */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
              <span>
                Showing {startIndex + 1}-
                {Math.min(startIndex + itemsPerPage, notifications.length)} of{" "}
                {notifications.length} notifications
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs font-medium text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
