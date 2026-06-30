import supabase from "../supabase/supabase";

const fetchProfilesMap = async (userIds) => {
  if (userIds.length === 0) return {};

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, phone, department")
    .in("id", userIds);

  if (error) throw error;

  return Object.fromEntries((data || []).map((profile) => [profile.id, profile]));
};

const fetchEventsMap = async (eventIds) => {
  if (eventIds.length === 0) return {};

  const { data, error } = await supabase
    .from("events")
    .select("id, title, status, event_date, event_time, location")
    .in("id", eventIds);

  if (error) throw error;

  return Object.fromEntries((data || []).map((event) => [event.id, event]));
};

const mapRegistrationRow = (row, profilesMap, eventsMap) => {
  const profile = profilesMap[row.user_id];
  const event = eventsMap[row.event_id];

  return {
    registrationId: row.id,
    userId: row.user_id,
    participantName: profile?.name || "Unknown",
    email: profile?.email || "—",
    phone: profile?.phone || "—",
    department: profile?.department || "—",
    eventId: row.event_id,
    eventTitle: event?.title || "—",
    eventStatus: event?.status || "Upcoming",
    status: "Registered",
    attendance: row.attendance ?? false,
    attendanceLabel: row.attendance ? "Present" : "Absent",
    checkInTime: row.check_in_time,
    registeredAt: row.created_at,
    ticketId: row.ticket_id || "—",
  };
};

export const getAllParticipantRegistrations = async (eventId = null) => {
  let query = supabase
    .from("registrations")
    .select("id, user_id, event_id, ticket_id, attendance, check_in_time, created_at")
    .order("created_at", { ascending: false });

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const userIds = [...new Set((data || []).map((row) => row.user_id))];
  const eventIds = [...new Set((data || []).map((row) => row.event_id))];

  const [profilesMap, eventsMap] = await Promise.all([
    fetchProfilesMap(userIds),
    fetchEventsMap(eventIds),
  ]);

  return (data || []).map((row) => mapRegistrationRow(row, profilesMap, eventsMap));
};

export const getParticipantDetails = async (userId) => {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, email, phone, department")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  const { data, error } = await supabase
    .from("registrations")
    .select("id, user_id, event_id, ticket_id, attendance, check_in_time, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const eventIds = [...new Set((data || []).map((row) => row.event_id))];
  const eventsMap = await fetchEventsMap(eventIds);
  const profilesMap = { [userId]: profile };

  const registrations = (data || []).map((row) =>
    mapRegistrationRow(row, profilesMap, eventsMap)
  );

  return {
    profile: {
      id: profile.id,
      name: profile.name || "Unknown",
      email: profile.email || "—",
      phone: profile.phone || "—",
      department: profile.department || "—",
    },
    registrations,
    stats: {
      totalEvents: registrations.length,
      presentCount: registrations.filter((row) => row.attendance).length,
      absentCount: registrations.filter((row) => !row.attendance).length,
    },
  };
};

export const mapParticipantsForExport = (rows) =>
  rows.map((row) => ({
    participant: row.participantName,
    email: row.email,
    event: row.eventTitle,
    status: row.status,
    attendance: row.attendanceLabel,
    ticketId: row.ticketId,
    registeredAt: row.registeredAt
      ? new Date(row.registeredAt).toLocaleString("en-GB")
      : "—",
  }));

export const PARTICIPANT_EXPORT_COLUMNS = [
  { key: "participant", label: "Participant" },
  { key: "email", label: "Email" },
  { key: "event", label: "Event" },
  { key: "status", label: "Status" },
  { key: "attendance", label: "Attendance" },
  { key: "ticketId", label: "Ticket ID" },
  { key: "registeredAt", label: "Registered At" },
];
