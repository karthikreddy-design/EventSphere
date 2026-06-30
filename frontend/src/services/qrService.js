export const buildQRPayload = ({ registrationId, eventId, userId, ticketId }) => {
  return JSON.stringify({
    registrationId,
    eventId,
    userId,
    ticketId,
  });
};

export const parseQRPayload = (scannedText) => {
  if (!scannedText || typeof scannedText !== "string") {
    throw new Error("Invalid QR code");
  }

  const trimmed = scannedText.trim();

  try {
    const parsed = JSON.parse(trimmed);

    if (!parsed.ticketId && !parsed.registrationId) {
      throw new Error("Invalid ticket QR code");
    }

    return {
      registrationId: parsed.registrationId,
      eventId: parsed.eventId,
      userId: parsed.userId,
      ticketId: parsed.ticketId,
    };
  } catch {
    if (trimmed.startsWith("EVT-")) {
      return { ticketId: trimmed };
    }

    throw new Error("Invalid QR code format");
  }
};

export const formatTicketId = (registrationId) => {
  const year = new Date().getFullYear();
  return `EVT-${year}-${String(registrationId).padStart(5, "0")}`;
};

export const formatCheckInTime = (timestamp) => {
  if (!timestamp) return "—";

  return new Date(timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatEventDate = (dateStr) => {
  if (!dateStr) return "—";

  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
