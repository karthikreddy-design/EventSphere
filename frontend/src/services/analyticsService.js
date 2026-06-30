import supabase from "../supabase/supabase";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const buildMonthlyBuckets = (months = 6) => {
  const buckets = [];

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() - index);

    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`,
      year: date.getFullYear(),
      month: date.getMonth(),
    });
  }

  return buckets;
};

export const getAdminAnalytics = async () => {
  const [eventsResult, registrationsResult] = await Promise.all([
    supabase.from("events").select("id, category, status, created_at"),
    supabase
      .from("registrations")
      .select("id, user_id, event_id, attendance, created_at, check_in_time"),
  ]);

  if (eventsResult.error) throw eventsResult.error;
  if (registrationsResult.error) throw registrationsResult.error;

  const events = eventsResult.data || [];
  const registrations = registrationsResult.data || [];

  const totalEvents = events.length;
  const upcomingEvents = events.filter(
    (event) => (event.status || "Upcoming") === "Upcoming"
  ).length;

  const uniqueParticipants = new Set(
    registrations.map((registration) => registration.user_id)
  ).size;

  const attendedCount = registrations.filter(
    (registration) => registration.attendance === true
  ).length;
  const attendancePercentage =
    registrations.length > 0
      ? Math.round((attendedCount / registrations.length) * 100)
      : 0;

  const monthlyBuckets = buildMonthlyBuckets(6);
  const monthlyRegistrations = monthlyBuckets.map((bucket) => ({
    label: bucket.label,
    count: registrations.filter((registration) => {
      const createdAt = new Date(registration.created_at);
      return (
        createdAt.getFullYear() === bucket.year &&
        createdAt.getMonth() === bucket.month
      );
    }).length,
  }));

  const categoryCounts = {};
  events.forEach((event) => {
    const category = event.category || "Uncategorized";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const popularCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const attendanceTrend = monthlyBuckets.map((bucket) => {
    const monthRegistrations = registrations.filter((registration) => {
      const createdAt = new Date(registration.created_at);
      return (
        createdAt.getFullYear() === bucket.year &&
        createdAt.getMonth() === bucket.month
      );
    });

    const checkedIn = monthRegistrations.filter(
      (registration) => registration.attendance === true
    ).length;

    return {
      label: bucket.label,
      registered: monthRegistrations.length,
      checkedIn,
    };
  });

  return {
    totalEvents,
    upcomingEvents,
    totalParticipants: uniqueParticipants,
    attendancePercentage,
    revenue: 0,
    monthlyRegistrations,
    popularCategories,
    attendanceTrend,
  };
};
