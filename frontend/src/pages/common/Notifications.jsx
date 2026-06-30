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
  sendEventReminders,
} from "../../services/notificationService";
import { syncNotificationBadge } from "../../utils/notificationEvents";
import "../../styles/notifications.css";

function Notifications({ role = "participant" }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const copy = getRoleNotificationCopy(role);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      if (role === "participant") {
        await sendEventReminders();
      }
      const data = await getNotifications(role);
      setNotifications(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_read: true } : item
      )
    );

    try {
      await markAsRead(id);
      syncNotificationBadge();
    } catch (err) {
      toast.error(err.message);
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, is_read: true }))
    );

    try {
      await markAllAsRead(role);
      syncNotificationBadge();
      toast.success("All notifications marked as read", { autoClose: 2200 });
    } catch (err) {
      toast.error(err.message);
      fetchNotifications();
    }
  };

  const handleDelete = async (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteNotification(id);
      syncNotificationBadge();
    } catch (err) {
      toast.error(err.message);
      fetchNotifications();
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
      ) : notifications.length === 0 ? (
        <div className="notifications-page__empty">
          <Icon name="notifications" size={40} />
          <h2>{copy.emptyTitle}</h2>
          <p>{copy.emptyText}</p>
        </div>
      ) : (
        <ul className="notifications-page__list">
          {notifications.map((item) => {
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

export default Notifications;
