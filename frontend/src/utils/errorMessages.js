export const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (!error) return fallback;

  const message = error.message || String(error);

  if (
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.includes("network")
  ) {
    return "Please check your internet connection and try again.";
  }

  if (message.includes("JWT") || message.includes("session")) {
    return "Your session has expired. Please log in again.";
  }

  return message || fallback;
};

export const PAGE_ERRORS = {
  events: {
    title: "Unable to load events",
    message: "We couldn't fetch the events list. Please check your internet connection.",
  },
  dashboard: {
    title: "Unable to load dashboard",
    message: "We couldn't load analytics data. Please check your internet connection.",
  },
  reports: {
    title: "Unable to load report",
    message: "We couldn't generate this report. Please check your internet connection.",
  },
  notifications: {
    title: "Unable to load notifications",
    message: "We couldn't fetch your notifications. Please check your internet connection.",
  },
  profile: {
    title: "Unable to load profile",
    message: "We couldn't load your profile. Please check your internet connection.",
  },
  participants: {
    title: "Unable to load participants",
    message: "We couldn't fetch participant registrations. Please check your internet connection.",
  },
};
