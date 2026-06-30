export const EVENT_CATEGORIES = [
  "Technology",
  "Sports",
  "Workshop",
  "Seminar",
  "Hackathon",
  "Cultural",
  "Placement",
];

export const BROWSE_SORT_OPTIONS = [
  { value: "Newest", label: "Newest" },
  { value: "Oldest", label: "Oldest" },
  { value: "Upcoming", label: "Upcoming" },
  { value: "Popular", label: "Popular" },
];

export const getEventStartDate = (event) => {
  if (!event?.event_date) return null;

  const date = new Date(`${event.event_date}T00:00:00`);

  if (event.event_time) {
    const match = event.event_time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridiem = match[3]?.toUpperCase();

      if (meridiem === "PM" && hours < 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;

      date.setHours(hours, minutes, 0, 0);
      return date;
    }
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

export const hasEventStarted = (event) => {
  const status = event?.status || "Upcoming";

  if (status === "Ongoing" || status === "Completed") {
    return true;
  }

  const startDate = getEventStartDate(event);
  if (!startDate) return false;

  return Date.now() >= startDate.getTime();
};

export const hasEventDatePassed = (event) => {
  if (!event?.event_date) return false;

  const status = event?.status || "Upcoming";
  if (status === "Completed") return true;

  const startDate = getEventStartDate(event);
  if (!startDate) {
    const eventDay = new Date(`${event.event_date}T23:59:59`);
    return Date.now() > eventDay.getTime();
  }

  return Date.now() > startDate.getTime();
};

export const isEventFull = (event) => {
  const registeredCount = event?.registered_count || 0;
  const maxParticipants = event?.max_participants;

  return maxParticipants != null && registeredCount >= maxParticipants;
};

export const getRegistrationBlockReason = (event, { isRegistered = false } = {}) => {
  if (!event) return "Event not found";

  const status = event.status || "Upcoming";

  if (isRegistered) {
    return "ALREADY_REGISTERED";
  }

  if (status === "Cancelled") {
    return "EVENT_CANCELLED";
  }

  if (status === "Completed") {
    return "EVENT_ENDED";
  }

  if (hasEventDatePassed(event)) {
    return "DATE_PASSED";
  }

  if (isEventFull(event)) {
    return "REGISTRATION_CLOSED";
  }

  return null;
};

export const getRegistrationButtonLabel = (reason, { registering = false } = {}) => {
  if (registering) return "Registering...";

  switch (reason) {
    case "ALREADY_REGISTERED":
      return "Already Registered";
    case "REGISTRATION_CLOSED":
      return "Registration Closed";
    case "EVENT_ENDED":
      return "Event Ended";
    case "EVENT_CANCELLED":
      return "Event Cancelled";
    default:
      return "Register Now";
  }
};

export const getAttendanceLabel = (event, attendance) => {
  const status = event?.status || "Upcoming";

  if (status === "Completed") {
    return attendance ? "Present" : "Absent";
  }

  if (status === "Ongoing") {
    return attendance ? "Present" : "Pending";
  }

  return "Pending";
};

export const sortBrowseEvents = (events, sortBy) => {
  const result = [...events];

  switch (sortBy) {
    case "Oldest":
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
    case "Upcoming":
      result.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
      break;
    case "Popular":
      result.sort(
        (a, b) => (b.registered_count || 0) - (a.registered_count || 0)
      );
      break;
    default:
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
  }

  return result;
};
