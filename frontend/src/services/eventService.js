import supabase from "../supabase/supabase";
import {
  notifyEventCancelled,
  notifyEventUpdated,
} from "./notificationService";
import { fetchWithCache, invalidateCache } from "../utils/cache";
import { triggerNotificationRefresh } from "../utils/notificationEvents";

const BUCKET = "event-images";

export const uploadEventImage = async (file) => {
  const extension = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  return publicUrl;
};

export const createEvent = async (eventData) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("You must be logged in to create an event");

  const { data, error } = await supabase
    .from("events")
    .insert({
      ...eventData,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  invalidateCache("events:");
  return data;
};

const getRegistrationCountMap = async () => {
  const { data, error } = await supabase.rpc("get_registration_counts");

  if (error) throw error;

  return Object.fromEntries(
    (data || []).map((row) => [row.event_id, Number(row.registration_count) || 0])
  );
};

const attachRegistrationCounts = async (events) => {
  const counts = await getRegistrationCountMap();

  return events.map((event) => ({
    ...event,
    registered_count: counts[event.id] || 0,
  }));
};

export const getEvents = async () => {
  return fetchWithCache("events:all", async () => {
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return attachRegistrationCounts(events || []);
  });
};

export const getEventById = async (id) => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  const counts = await getRegistrationCountMap();

  return { ...data, registered_count: counts[id] || 0 };
};

export const updateEvent = async (id, eventData) => {
  const { data, error } = await supabase
    .from("events")
    .update(eventData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  try {
    if (eventData.status === "Cancelled") {
      await notifyEventCancelled(data);
    } else {
      await notifyEventUpdated(data);
    }
    triggerNotificationRefresh();
  } catch {
    // Event saved; notifications are best-effort.
  }

  invalidateCache("events:");
  return data;
};

export const deleteEvent = async (id) => {
  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  try {
    await notifyEventCancelled(event);
    triggerNotificationRefresh();
  } catch {
    // Continue with delete even if notifications fail.
  }

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) throw error;

  invalidateCache("events:");
};
