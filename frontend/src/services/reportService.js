import jsPDF from "jspdf";
import * as XLSX from "xlsx";
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

export const getParticipantsReport = async (eventId = null) => {
  let query = supabase
    .from("registrations")
    .select("id, user_id, event_id, ticket_id, attendance, created_at")
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
      email: profile?.email || "—",
      phone: profile?.phone || "—",
      department: profile?.department || "—",
      ticketId: row.ticket_id || "—",
      registeredAt: row.created_at
        ? new Date(row.created_at).toLocaleString("en-GB")
        : "—",
    };
  });
};

export const getAttendanceReport = async (eventId = null) => {
  let query = supabase
    .from("registrations")
    .select("id, user_id, event_id, ticket_id, attendance, check_in_time")
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

export const getEventsReport = async () => {
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  if (error) throw error;

  const { data: counts, error: countsError } = await supabase.rpc(
    "get_registration_counts"
  );

  if (countsError) throw countsError;

  const countMap = Object.fromEntries(
    (counts || []).map((row) => [row.event_id, row.registration_count])
  );

  return (events || []).map((event) => ({
    title: event.title,
    category: event.category || "—",
    date: event.event_date
      ? new Date(event.event_date).toLocaleDateString("en-GB")
      : "—",
    location: event.location || "—",
    status: event.status || "Upcoming",
    maxParticipants: event.max_participants ?? "—",
    registered: countMap[event.id] || 0,
  }));
};

export const exportToExcel = (rows, filename, sheetName = "Report") => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};

export const exportToPdf = (title, columns, rows, filename) => {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  doc.setFontSize(16);
  doc.text(title, 14, y);
  y += 10;

  doc.setFontSize(9);
  const colWidth = (pageWidth - 28) / columns.length;

  columns.forEach((column, index) => {
    doc.text(column.label, 14 + index * colWidth, y);
  });

  y += 6;
  doc.setLineWidth(0.2);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  rows.forEach((row) => {
    if (y > doc.internal.pageSize.getHeight() - 14) {
      doc.addPage();
      y = 18;
    }

    columns.forEach((column, index) => {
      const value = String(row[column.key] ?? "—");
      doc.text(value.slice(0, 28), 14 + index * colWidth, y);
    });

    y += 6;
  });

  doc.save(filename);
};
