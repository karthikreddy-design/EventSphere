export const triggerNotificationRefresh = () => {
  window.dispatchEvent(
    new CustomEvent("eventhub:notifications-refresh", {
      detail: { showPopup: true },
    })
  );
};

export const syncNotificationBadge = () => {
  window.dispatchEvent(
    new CustomEvent("eventhub:notifications-refresh", {
      detail: { showPopup: false },
    })
  );
};
