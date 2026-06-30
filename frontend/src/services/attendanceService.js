import supabase from "../supabase/supabase";
import { parseQRPayload } from "./qrService";
import {
  notifyAdminAttendanceCheckIn,
  notifyParticipantAttendanceConfirmed,
} from "./notificationService";
import { triggerNotificationRefresh } from "../utils/notificationEvents";

const fetchProfilesMap = async (userIds) => {
  if (userIds.length === 0) return {};

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", userIds);

  if (error) throw error;

  return Object.fromEntries(
    (data || []).map((profile) => [profile.id, profile])
  );
};

const getRegistrationWithDetails = async (registration) => {
  const profilesMap = await fetchProfilesMap([registration.user_id]);
  const profile = profilesMap[registration.user_id];
  const event = registration.events;

  return {
    registrationId: registration.id,
    userId: registration.user_id,
    ticketId: registration.ticket_id,
    attendance: registration.attendance,
    checkInTime: registration.check_in_time,
    participantName: profile?.name || "Unknown",
    participantEmail: profile?.email || "",
    eventId: event?.id,
    eventTitle: event?.title || "Unknown Event",
    eventDate: event?.event_date,
    eventLocation: event?.location,
    eventCreatedBy: event?.created_by,
  };
};

export const getRegistrationByTicketId = async (ticketId) => {
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
      events (id, title, event_date, location, created_by)
    `
    )
    .eq("ticket_id", ticketId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Registration not found");

  return getRegistrationWithDetails(data);
};

export const getRegistrationById = async (registrationId) => {
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
      events (id, title, event_date, event_time, location, created_by)
    `
    )
    .eq("id", registrationId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Registration not found");

  return getRegistrationWithDetails(data);
};

export const markAttendance = async (scannedText) => {
  const payload = parseQRPayload(scannedText);

  let registration;

  if (payload.ticketId) {
    registration = await getRegistrationByTicketId(payload.ticketId);
  } else if (payload.registrationId) {
    registration = await getRegistrationById(payload.registrationId);
  } else {
    throw new Error("Invalid QR code");
  }

  if (registration.attendance) {
    return {
      status: "ALREADY_MARKED",
      ...registration,
      checkInTime: registration.checkInTime,
    };
  }

  const checkInTime = new Date().toISOString();

  const { error } = await supabase
    .from("registrations")
    .update({
      attendance: true,
      check_in_time: checkInTime,
    })
    .eq("id", registration.registrationId);

  if (error) throw error;

  const event = {
    id: registration.eventId,
    title: registration.eventTitle,
    event_date: registration.eventDate,
    location: registration.eventLocation,
    created_by: registration.eventCreatedBy,
  };

  try {
    await notifyParticipantAttendanceConfirmed(registration.userId, event);
  } catch {
    // Check-in succeeded; participant notification is best-effort.
  }
  try {
    await notifyAdminAttendanceCheckIn(event, registration.userId);
  } catch {
    // Check-in succeeded; admin notification is best-effort.
  }

  triggerNotificationRefresh();

  return {
    status: "SUCCESS",
    ...registration,
    attendance: true,
    checkInTime,
  };
};

export const getEventParticipants = async (eventId) => {
  const { data, error } = await supabase
    .from("registrations")
    .select("id, user_id, ticket_id, attendance, check_in_time, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const userIds = [...new Set((data || []).map((row) => row.user_id))];
  const profilesMap = await fetchProfilesMap(userIds);

  return (data || []).map((row) => {
    const profile = profilesMap[row.user_id];

    return {
      registrationId: row.id,
      ticketId: row.ticket_id,
      participantName: profile?.name || "Unknown",
      participantEmail: profile?.email || "",
      attendance: row.attendance ?? false,
      checkInTime: row.check_in_time,
      registeredAt: row.created_at,
    };
  });
};

export const getAttendanceDashboardStats = async () => {
  const today = new Date().toISOString().split("T")[0];

  const { data: todayEvents, error: eventsError } = await supabase
    .from("events")
    .select("id")
    .eq("event_date", today);

  if (eventsError) throw eventsError;

  const todayEventIds = todayEvents?.map((event) => event.id) || [];

  if (todayEventIds.length === 0) {
    return {
      registered: 0,
      checkedIn: 0,
      pending: 0,
      attendancePercentage: 0,
    };
  }

  const { data: registrations, error: regError } = await supabase
    .from("registrations")
    .select("attendance")
    .in("event_id", todayEventIds);

  if (regError) throw regError;

  const registered = registrations?.length || 0;
  const checkedIn =
    registrations?.filter((row) => row.attendance === true).length || 0;
  const pending = registered - checkedIn;
  const attendancePercentage =
    registered > 0 ? Math.round((checkedIn / registered) * 100) : 0;

  return {
    registered,
    checkedIn,
    pending,
    attendancePercentage,
  };
};

export const getAttendanceReport = async (eventId = null) => {
  let query = supabase
    .from("registrations")
    .select("id, user_id, ticket_id, attendance, check_in_time, event_id")
    .order("created_at", { ascending: true });

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const userIds = [...new Set((data || []).map((row) => row.user_id))];
  const eventIds = [...new Set((data || []).map((row) => row.event_id))];

  const [profilesMap, eventsMap] = await Promise.all([
    fetchProfilesMap(userIds),
    (async () => {
      if (eventIds.length === 0) return {};
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("id, title")
        .in("id", eventIds);
      if (eventsError) throw eventsError;
      return Object.fromEntries((events || []).map((event) => [event.id, event]));
    })(),
  ]);

  return (data || []).map((row) => {
    const profile = profilesMap[row.user_id];
    const event = eventsMap[row.event_id];

    return {
      eventName: event?.title || "—",
      participant: profile?.name || "Unknown",
      ticketId: row.ticket_id || "—",
      attendance: row.attendance ? "Present" : "Absent",
      checkInTime: row.check_in_time
        ? new Date(row.check_in_time).toLocaleString("en-GB")
        : "—",
    };
  });
};

export const exportReportToCsv = (rows, filename = "attendance-report.csv") => {
  const headers = [
    "Event Name",
    "Participant",
    "Ticket ID",
    "Attendance",
    "Check-in Time",
  ];

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      [
        `"${row.eventName}"`,
        `"${row.participant}"`,
        `"${row.ticketId}"`,
        `"${row.attendance}"`,
        `"${row.checkInTime}"`,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportReportToPdf = (rows, title = "Attendance Report") => {
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    throw new Error("Please allow pop-ups to export PDF");
  }

  const tableRows = rows
    .map(
      (row) => `
      <tr>
        <td>${row.eventName}</td>
        <td>${row.participant}</td>
        <td>${row.ticketId}</td>
        <td>${row.attendance}</td>
        <td>${row.checkInTime}</td>
      </tr>
    `
    )
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { font-size: 20px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Participant</th>
              <th>Ticket ID</th>
              <th>Attendance</th>
              <th>Check-in Time</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
