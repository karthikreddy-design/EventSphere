import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getNotifications,
  getUnreadCount,
  sendEventReminders,
} from "../services/notificationService";

const POLL_MS = 5000;

export function useNotificationBadge(role) {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const knownCountRef = useRef(0);
  const initializedRef = useRef(false);

  const refreshUnread = useCallback(
    async (showPopup = false) => {
      try {
        if (role === "participant") {
          await sendEventReminders();
        }

        const count = await getUnreadCount(role);

        if (
          showPopup &&
          initializedRef.current &&
          count > knownCountRef.current
        ) {
          const notifications = await getNotifications(role);
          const newestUnread = notifications.find((item) => !item.is_read);
          if (newestUnread) {
            toast.info(newestUnread.title, {
              autoClose: 2200,
              toastId: `notification-${newestUnread.id}`,
            });
          }
        }

        initializedRef.current = true;
        knownCountRef.current = count;
        setUnreadCount(count);
      } catch {
        setUnreadCount(0);
      }
    },
    [role]
  );

  useEffect(() => {
    refreshUnread(false);
  }, [refreshUnread, location.pathname]);

  useEffect(() => {
    const intervalId = window.setInterval(() => refreshUnread(true), POLL_MS);
    const onFocus = () => refreshUnread(true);
    const onRefresh = (event) => {
      const showPopup = event?.detail?.showPopup ?? true;
      refreshUnread(showPopup);
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("eventhub:notifications-refresh", onRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("eventhub:notifications-refresh", onRefresh);
    };
  }, [refreshUnread]);

  return { unreadCount, refreshUnread };
}
