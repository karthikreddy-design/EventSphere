import supabase from "../supabase/supabase";
import {
  notifyAdminEventCapacityFull,
  notifyAdminNewRegistration,
  notifyRegistrationConfirmed,
} from "./notificationService";
import { triggerNotificationRefresh } from "../utils/notificationEvents";
import {
  getRegistrationBlockReason,
  hasEventStarted,
} from "../utils/eventValidation";

const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("You must be logged in");

  return user;
};

export const getRegistrationCount = async (eventId) => {
  const { count, error } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (error) throw error;

  return count || 0;
};

export const isAlreadyRegistered = async (eventId) => {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
};

const fetchEventForRegistration = async (eventId) => {
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (eventError) throw eventError;

  const registeredCount = await getRegistrationCount(eventId);

  return { ...event, registered_count: registeredCount };
};

export const validateRegistration = async (eventId, { isRegistered } = {}) => {
  const event = await fetchEventForRegistration(eventId);
  const blockReason = getRegistrationBlockReason(event, { isRegistered });

  if (blockReason === "ALREADY_REGISTERED") {
    throw new Error("You have already registered for this event");
  }

  if (blockReason === "REGISTRATION_CLOSED") {
    throw new Error("Registration closed. No new registrations allowed.");
  }

  if (blockReason === "EVENT_CANCELLED") {
    throw new Error("This event has been cancelled");
  }

  if (blockReason === "EVENT_ENDED" || blockReason === "DATE_PASSED") {
    throw new Error("Registration closed. The event date has passed.");
  }

  return event;
};

export const registerForEvent = async (eventId) => {
  await getCurrentUser();

  const alreadyRegistered = await isAlreadyRegistered(eventId);
  await validateRegistration(eventId, { isRegistered: alreadyRegistered });

  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("registrations")
    .insert({
      user_id: user.id,
      event_id: eventId,
      attendance: false,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("You have already registered for this event");
    }
    throw error;
  }

  const { data: withTicket, error: fetchError } = await supabase
    .from("registrations")
    .select("*")
    .eq("id", data.id)
    .single();

  if (fetchError) throw fetchError;

  const event = await fetchEventForRegistration(eventId);
  try {
    await notifyRegistrationConfirmed(user.id, event);
  } catch {
    // Registration succeeded; participant notification is best-effort.
  }
  try {
    await notifyAdminNewRegistration(event, user.id);
  } catch {
    // Registration succeeded; admin registration alert is best-effort.
  }
  try {
    await notifyAdminEventCapacityFull(event, event.registered_count);
  } catch {
    // Registration succeeded; capacity alert is best-effort.
  }

  triggerNotificationRefresh();

  return withTicket;
};

export const cancelRegistration = async (eventId) => {
  const user = await getCurrentUser();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (eventError) throw eventError;

  if (hasEventStarted(event)) {
    throw new Error("Cannot cancel registration after the event has started");
  }

  const { error } = await supabase
    .from("registrations")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  if (error) throw error;
};

export const getMyEvents = async () => {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("registrations")
    .select(
      `
      id,
      created_at,
      attendance,
      ticket_id,
      check_in_time,
      events (
        id,
        title,
        description,
        category,
        location,
        event_date,
        event_time,
        image_url,
        max_participants,
        status,
        created_by
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || [])
    .map((registration) => {
      const event = registration.events;
      if (!event) return null;

      return {
        registrationId: registration.id,
        registeredAt: registration.created_at,
        attendance: registration.attendance ?? false,
        ticketId: registration.ticket_id,
        checkInTime: registration.check_in_time,
        ...event,
      };
    })
    .filter(Boolean);
};

export const getMyRegistrationStats = async () => {
  const events = await getMyEvents();

  const upcomingCount = events.filter((event) => {
    const status = event.status || "Upcoming";
    return status === "Upcoming" || status === "Ongoing";
  }).length;

  const completedEvents = events.filter(
    (event) => (event.status || "Upcoming") === "Completed"
  );

  const completedCount = completedEvents.length;

  const attendedCount = completedEvents.filter(
    (event) => event.attendance === true
  ).length;

  const attendancePercentage =
    completedCount > 0
      ? Math.round((attendedCount / completedCount) * 100)
      : 0;

  return {
    registeredCount: events.length,
    upcomingCount,
    completedCount,
    attendancePercentage,
  };
};

export const getMyTickets = async () => {
  const user = await getCurrentUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const { data, error } = await supabase
    .from("registrations")
    .select(
      `
      id,
      user_id,
      event_id,
      ticket_id,
      attendance,
      check_in_time,
      events (
        id,
        title,
        event_date,
        event_time,
        location,
        status
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || [])
    .filter((row) => row.events && row.ticket_id)
    .map((row) => ({
      registrationId: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      ticketId: row.ticket_id,
      attendance: row.attendance,
      checkInTime: row.check_in_time,
      participantName: profile?.name || "Participant",
      eventTitle: row.events.title,
      eventDate: row.events.event_date,
      eventTime: row.events.event_time,
      venue: row.events.location,
      status: row.events.status,
    }));
};
