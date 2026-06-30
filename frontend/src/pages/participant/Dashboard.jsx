import { useEffect, useState } from "react";
import DashboardCard from "../../components/DashboardCard";
import { getMyRegistrationStats } from "../../services/registrationService";

const participantCards = [
  { title: "Registered Events", icon: "ticket", key: "registeredCount" },
  { title: "Upcoming Events", icon: "calendar", key: "upcomingCount" },
  { title: "Completed Events", icon: "events", key: "completedCount" },
  {
    title: "Attendance",
    icon: "attendance",
    key: "attendancePercentage",
    format: (value) => `${value}%`,
  },
];

function Dashboard() {
  const [stats, setStats] = useState({
    registeredCount: 0,
    upcomingCount: 0,
    completedCount: 0,
    attendancePercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getMyRegistrationStats();
        setStats(data);
      } catch {
        setStats({
          registeredCount: 0,
          upcomingCount: 0,
          completedCount: 0,
          attendancePercentage: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <section className="dashboard-page">
      <header className="dashboard-page__header">
        <h1 className="dashboard-page__title">Participant Dashboard</h1>
        <p className="dashboard-page__subtitle">Your events and tickets at a glance</p>
      </header>

      <div className="dashboard-page__grid dashboard-page__grid--participant">
        {participantCards.map((card) => {
          const rawValue = stats[card.key];
          const displayValue =
            loading
              ? "..."
              : card.format
                ? card.format(rawValue)
                : rawValue;

          return (
            <DashboardCard
              key={card.title}
              title={card.title}
              value={displayValue}
              icon={card.icon}
            />
          );
        })}
      </div>
    </section>
  );
}

export default Dashboard;
