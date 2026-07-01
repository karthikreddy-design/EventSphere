import supabase from "../supabase/supabase";
import { formatEventDate } from "./qrService";

export const NOTIFICATION_TYPES = {
  REGISTRATION_CONFIRMED: "registration_confirmed",
  EVENT_UPDATED: "event_updated",
  EVENT_CANCELLED: "event_cancelled",
  EVENT_REMINDER: "event_reminder",
  ATTENDANCE_CONFIRMED: "attendance_confirmed",
  NEW_REGISTRATION: "new_registration",
  EVENT_CAPACITY_FULL: "event_capacity_full",
  ATTENDANCE_CHECKIN: "attendance_checkin",
};

const PARTICIPANT_TYPES = [
  NOTIFICATION_TYPES.REGISTRATION_CONFIRMED,
  NOTIFICATION_TYPES.EVENT_UPDATED,
  NOTIFICATION_TYPES.EVENT_CANCELLED,
  NOTIFICATION_TYPES.EVENT_REMINDER,
  NOTIFICATION_TYPES.ATTENDANCE_CONFIRMED,
];

const ADMIN_TYPES = [
  NOTIFICATION_TYPES.NEW_REGISTRATION,
  NOTIFICATION_TYPES.EVENT_CAPACITY_FULL,
  NOTIFICATION_TYPES.ATTENDANCE_CHECKIN,
];

export const NOTIFICATION_META = {
  [NOTIFICATION_TYPES.REGISTRATION_CONFIRMED]: {
    label: "Registration",
    tone: "blue",
  },
  [NOTIFICATION_TYPES.EVENT_UPDATED]: {
    label: "Event Update",
    tone: "amber",
  },
  [NOTIFICATION_TYPES.EVENT_CANCELLED]: {
    label: "Cancellation",
    tone: "red",
  },
  [NOTIFICATION_TYPES.EVENT_REMINDER]: {
    label: "Reminder",
    tone: "purple",
  },
  [NOTIFICATION_TYPES.ATTENDANCE_CONFIRMED]: {
    label: "Attendance",
    tone: "green",
  },
  [NOTIFICATION_TYPES.NEW_REGISTRATION]: {
    label: "New Registration",
    tone: "blue",
  },
  [NOTIFICATION_TYPES.EVENT_CAPACITY_FULL]: {
    label: "Capacity Full",
    tone: "amber",
  },
  [NOTIFICATION_TYPES.ATTENDANCE_CHECKIN]: {
    label: "Check-in",
    tone: "green",
  },
};

const ROLE_COPY = {
  admin: {
    subtitle: "Alerts for registrations, capacity, and attendance on your events",
    emptyTitle: "No Admin Notifications",
    emptyText:
      "You'll be notified when participants register, when an event reaches capacity, and when attendance is recorded.",
  },
  participant: {
    subtitle: "Confirmations, event updates, reminders, and attendance alerts",
    emptyTitle: "No Notifications",
    emptyText:
      "You'll receive registration confirmations, event updates, reminders, and check-in alerts here.",
  },
};

const getTypesForRole = (role) =>
  role === "admin" ? ADMIN_TYPES : PARTICIPANT_TYPES;

export const getRoleNotificationCopy = (role) =>
  ROLE_COPY[role === "admin" ? "admin" : "participant"];

const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("You must be logged in");

  return user;
};

const getUserName = async (userId) => {
  const { data } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .maybeSingle();

  return data?.name || "there";
};

const formatEventDetails = (event) => {
  return `Date: ${formatEventDate(event.event_date)}\nVenue: ${event.location || "—"}`;
};

const getAdminRecipientIds = async (event) => {
  if (event?.created_by) {
    return [event.created_by];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (error) throw error;

  return (data || []).map((row) => row.id);
};

export const createNotification = async ({
  userId,
  title,
  message,
  type,
  eventId = null,
}) => {
  const { data, error } = await supabase.rpc("insert_notification", {
    p_user_id: userId,
    p_title: title,
    p_message: message,
    p_type: type,
    p_event_id: eventId,
  });

  if (error) throw error;

  return { id: data };
};

export const getNotifications = async (role = "participant") => {
  const user = await getCurrentUser();
  const types = getTypesForRole(role);

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .in("type", types)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
};

export const getUnreadCount = async (role = "participant") => {
  const user = await getCurrentUser();
  const types = getTypesForRole(role);

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)
    .in("type", types);

  if (error) throw error;

  return count || 0;
};

export const markAsRead = async (notificationId) => {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) throw error;
};

export const markAllAsRead = async (role = "participant") => {
  const user = await getCurrentUser();
  const types = getTypesForRole(role);

  const { data: unreadRows, error: fetchError } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .in("type", types);

  if (fetchError) throw fetchError;
  if (!unreadRows?.length) return;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)
    .in("type", types);

  if (error) throw error;
};

export const deleteNotification = async (notificationId) => {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) throw error;
};

const getEventRegistrantIds = async (eventId) => {
  const { data, error } = await supabase
    .from("registrations")
    .select("user_id")
    .eq("event_id", eventId);

  if (error) throw error;

  return (data || []).map((row) => row.user_id);
};

const hasNotification = async (userId, type, eventId) => {
  const { data, error } = await supabase.rpc("notification_exists", {
    p_user_id: userId,
    p_type: type,
    p_event_id: eventId,
  });

  if (error) throw error;

  return Boolean(data);
};

export const notifyRegistrationConfirmed = async (userId, event) => {
  const name = await getUserName(userId);

  return createNotification({
    userId,
    title: "Registration Confirmed",
    message: `Hi ${name},\n\nYou have successfully registered for ${event.title}.\n\n${formatEventDetails(event)}`,
    type: NOTIFICATION_TYPES.REGISTRATION_CONFIRMED,
    eventId: event.id,
  });
};

export const notifyAdminNewRegistration = async (event, participantUserId) => {
  const recipients = (await getAdminRecipientIds(event)).filter(
    (userId) => userId !== participantUserId
  );

  if (!recipients.length) return;

  const participantName = await getUserName(participantUserId);

  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        userId,
        title: "New Registration",
        message: `${participantName} registered for "${event.title}".\n\nReview participants to manage attendance and exports.`,
        type: NOTIFICATION_TYPES.NEW_REGISTRATION,
        eventId: event.id,
      })
    )
  );
};

export const notifyAdminEventCapacityFull = async (event, registeredCount) => {
  if (!event?.max_participants || registeredCount < event.max_participants) {
    return;
  }

  const recipients = await getAdminRecipientIds(event);

  await Promise.all(
    recipients.map(async (userId) => {
      const alreadySent = await hasNotification(
        userId,
        NOTIFICATION_TYPES.EVENT_CAPACITY_FULL,
        event.id
      );

      if (alreadySent) return;

      await createNotification({
        userId,
        title: "Event at Full Capacity",
        message: `"${event.title}" has reached its maximum capacity (${event.max_participants} participants).`,
        type: NOTIFICATION_TYPES.EVENT_CAPACITY_FULL,
        eventId: event.id,
      });
    })
  );
};

export const notifyParticipantAttendanceConfirmed = async (userId, event) => {
  const name = await getUserName(userId);

  await createNotification({
    userId,
    title: "Check-in Successful",
    message: `Hi ${name},\n\nYou have been marked present for "${event.title}".\n\n${formatEventDetails(event)}`,
    type: NOTIFICATION_TYPES.ATTENDANCE_CONFIRMED,
    eventId: event.id,
  });
};

export const notifyAdminAttendanceCheckIn = async (
  event,
  participantUserId
) => {
  const recipients = await getAdminRecipientIds(event);

  if (!recipients.length) return;

  const participantName = await getUserName(participantUserId);

  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        userId,
        title: "Attendance Recorded",
        message: `${participantName} checked in for "${event.title}".`,
        type: NOTIFICATION_TYPES.ATTENDANCE_CHECKIN,
        eventId: event.id,
      })
    )
  );
};

export const notifyEventUpdated = async (event) => {
  const registrantIds = await getEventRegistrantIds(event.id);

  await Promise.all(
    registrantIds.map((userId) =>
      createNotification({
        userId,
        title: "Event Updated",
        message: `The event "${event.title}" has been updated.\n\n${formatEventDetails(event)}\n\nPlease review the latest details.`,
        type: NOTIFICATION_TYPES.EVENT_UPDATED,
        eventId: event.id,
      })
    )
  );
};

export const notifyEventCancelled = async (event) => {
  const registrantIds = await getEventRegistrantIds(event.id);

  await Promise.all(
    registrantIds.map((userId) =>
      createNotification({
        userId,
        title: "Event Cancelled",
        message: `We regret to inform you that "${event.title}" scheduled for ${formatEventDate(event.event_date)} at ${event.location || "—"} has been cancelled.`,
        type: NOTIFICATION_TYPES.EVENT_CANCELLED,
        eventId: event.id,
      })
    )
  );
};

export const sendEventReminders = async () => {
  const user = await getCurrentUser();

  const { data: registrations, error } = await supabase
    .from("registrations")
    .select(
      `
      event_id,
      events (
        id,
        title,
        event_date,
        location,
        status
      )
    `
    )
    .eq("user_id", user.id);

  if (error) throw error;

  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  for (const registration of registrations || []) {
    const event = registration.events;
    if (!event || event.status === "Cancelled" || event.status === "Completed") {
      continue;
    }

    if (!event.event_date) continue;

    const eventDate = new Date(`${event.event_date}T00:00:00`);
    if (eventDate < now || eventDate > in24Hours) continue;

    const alreadySent = await hasNotification(
      user.id,
      NOTIFICATION_TYPES.EVENT_REMINDER,
      event.id
    );

    if (alreadySent) continue;

    const name = await getUserName(user.id);

    await createNotification({
      userId: user.id,
      title: "Reminder: Event Coming Up",
      message: `Hi ${name},\n\nYour event "${event.title}" is coming up on ${formatEventDate(event.event_date)} at ${event.location || "—"}.\n\nDon't forget your QR ticket!`,
      type: NOTIFICATION_TYPES.EVENT_REMINDER,
      eventId: event.id,
    });
  }
};
