import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Icon from "../../components/Icon";
import {
  deleteNotification,
  getNotifications,
  getRoleNotificationCopy,
  markAllAsRead,
  markAsRead,
  NOTIFICATION_META,
  NOTIFICATION_TYPES,
  sendEventReminders,
} from "../../services/notificationService";
import { syncNotificationBadge } from "../../utils/notificationEvents";
import "../../styles/notifications.css";

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  {
    id: NOTIFICATION_TYPES.REGISTRATION_CONFIRMED,
    label: "Registration",
  },
  { id: NOTIFICATION_TYPES.EVENT_UPDATED, label: "Event Update" },
  { id: NOTIFICATION_TYPES.EVENT_CANCELLED, label: "Cancellation" },
  { id: NOTIFICATION_TYPES.EVENT_REMINDER, label: "Reminder" },
  { id: NOTIFICATION_TYPES.ATTENDANCE_CONFIRMED, label: "Attendance" },
];

const REFRESH_MS = 5000;

function ParticipantNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const copy = getRoleNotificationCopy("participant");

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      await sendEventReminders();
      const data = await getNotifications("participant");
      setNotifications(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const intervalId = window.setInterval(() => fetchNotifications(true), REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    return notifications.filter((item) => item.type === activeFilter);
  }, [activeFilter, notifications]);

  const handleMarkRead = async (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
    );

    try {
      await markAsRead(id);
      syncNotificationBadge();
    } catch (err) {
      toast.error(err.message);
      fetchNotifications(true);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));

    try {
      await markAllAsRead("participant");
      syncNotificationBadge();
      toast.success("All notifications marked as read", { autoClose: 2200 });
    } catch (err) {
      toast.error(err.message);
      fetchNotifications(true);
    }
  };

  const handleDelete = async (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteNotification(id);
      syncNotificationBadge();
    } catch (err) {
      toast.error(err.message);
      fetchNotifications(true);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const typeSummary = useMemo(() => {
    const counts = {};
    notifications.forEach((item) => {
      const label = NOTIFICATION_META[item.type]?.label || "Update";
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts);
  }, [notifications]);

  return (
    <section className="notifications-page">
      <header className="notifications-page__header">
        <div>
          <h1 className="notifications-page__title">Notifications</h1>
          <p className="notifications-page__subtitle">{copy.subtitle}</p>
          {unreadCount > 0 && (
            <p className="notifications-page__unread">
              {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="notifications-page__mark-all"
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </button>
        )}
      </header>

      <div className="notifications-page__filters">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`notifications-page__filter ${
              activeFilter === option.id ? "notifications-page__filter--active" : ""
            }`}
            onClick={() => setActiveFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {!loading && notifications.length > 0 && typeSummary.length > 0 && (
        <div className="notifications-page__summary">
          {typeSummary.map(([label, count]) => (
            <span key={label} className="notifications-page__summary-item">
              {label}: {count}
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="notifications-page__loading">Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="notifications-page__empty">
          <Icon name="notifications" size={40} />
          <h2>
            {notifications.length === 0 ? copy.emptyTitle : "No matching notifications"}
          </h2>
          <p>
            {notifications.length === 0
              ? copy.emptyText
              : "Try another filter to view your alerts."}
          </p>
          {notifications.length === 0 && (
            <ul className="notifications-page__guide">
              <li>Registration Confirmed — when you register for an event</li>
              <li>Event Updated — when an admin edits an event you joined</li>
              <li>Event Cancelled — when an event is cancelled or deleted</li>
              <li>Event Reminder — within 24 hours of your event</li>
              <li>Check-in Successful — when you are scanned in at the event</li>
            </ul>
          )}
        </div>
      ) : (
        <ul className="notifications-page__list">
          {filteredNotifications.map((item) => {
            const meta = NOTIFICATION_META[item.type] || {
              label: "Update",
              tone: "blue",
            };

            return (
              <li
                key={item.id}
                className={`notifications-page__item ${item.is_read ? "notifications-page__item--read" : "notifications-page__item--unread"}`}
              >
                <div className="notifications-page__item-top">
                  <span
                    className={`notifications-page__type notifications-page__type--${meta.tone}`}
                  >
                    {meta.label}
                  </span>
                  <time>{formatTime(item.created_at)}</time>
                </div>
                <h3 className="notifications-page__item-title">{item.title}</h3>
                <p className="notifications-page__message">{item.message}</p>
                <div className="notifications-page__actions">
                  {!item.is_read && (
                    <button
                      type="button"
                      className="notifications-page__mark-read"
                      onClick={() => handleMarkRead(item.id)}
                    >
                      Mark as read
                    </button>
                  )}
                  {item.is_read && (
                    <button
                      type="button"
                      className="notifications-page__delete"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default ParticipantNotifications;
