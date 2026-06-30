import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import DashboardCard from "../../components/DashboardCard";
import ErrorState from "../../components/ErrorState";
import { CardSkeleton, ChartSkeleton } from "../../components/Skeleton";
import { getAdminAnalytics } from "../../services/analyticsService";
import { PAGE_ERRORS } from "../../utils/errorMessages";
import {
  CHART_COLORS,
  barChartOptions,
  doughnutChartOptions,
  lineChartOptions,
  shortMonthLabel,
} from "../../utils/chartTheme";
import "../../styles/analytics.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

ChartJS.defaults.font.family =
  "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";
ChartJS.defaults.color = "#94a3b8";

const adminCards = [
  { title: "Total Events", key: "totalEvents", icon: "events" },
  { title: "Upcoming Events", key: "upcomingEvents", icon: "calendar" },
  { title: "Participants", key: "totalParticipants", icon: "participants" },
  {
    title: "Attendance",
    key: "attendancePercentage",
    icon: "attendance",
    format: (value) => `${value}%`,
  },
  {
    title: "Revenue",
    key: "revenue",
    icon: "reports",
    format: (value) => (value > 0 ? `$${value}` : "—"),
  },
];

function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const monthlyChartData = useMemo(() => {
    if (!analytics) return null;

    return {
      labels: analytics.monthlyRegistrations.map((item) => shortMonthLabel(item.label)),
      datasets: [
        {
          label: "Registrations",
          data: analytics.monthlyRegistrations.map((item) => item.count),
          backgroundColor: CHART_COLORS.primary,
          hoverBackgroundColor: "#2563eb",
          borderRadius: 6,
        },
      ],
    };
  }, [analytics]);

  const categoryChartData = useMemo(() => {
    if (!analytics) return null;

    return {
      labels: analytics.popularCategories.map((item) => item.category),
      datasets: [
        {
          data: analytics.popularCategories.map((item) => item.count),
          backgroundColor: analytics.popularCategories.map(
            (_, index) => CHART_COLORS.palette[index % CHART_COLORS.palette.length]
          ),
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    };
  }, [analytics]);

  const attendanceTrendData = useMemo(() => {
    if (!analytics) return null;

    return {
      labels: analytics.attendanceTrend.map((item) => shortMonthLabel(item.label)),
      datasets: [
        {
          label: "Registered",
          data: analytics.attendanceTrend.map((item) => item.registered),
          borderColor: CHART_COLORS.primary,
          backgroundColor: CHART_COLORS.primarySoft,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: CHART_COLORS.primary,
          fill: true,
        },
        {
          label: "Checked In",
          data: analytics.attendanceTrend.map((item) => item.checkedIn),
          borderColor: CHART_COLORS.success,
          backgroundColor: CHART_COLORS.successSoft,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: CHART_COLORS.success,
          fill: true,
        },
      ],
    };
  }, [analytics]);

  if (error) {
    return (
      <section className="dashboard-page">
        <ErrorState
          title={PAGE_ERRORS.dashboard.title}
          message={PAGE_ERRORS.dashboard.message}
          onRetry={loadAnalytics}
        />
      </section>
    );
  }

  return (
    <section className="dashboard-page analytics-dashboard">
      <header className="dashboard-page__header">
        <h1 className="dashboard-page__title">Admin Dashboard</h1>
        <p className="dashboard-page__subtitle">
          Analytics overview for events, participants, and attendance
        </p>
      </header>

      {loading ? (
        <>
          <CardSkeleton count={5} />
          <ChartSkeleton count={3} />
        </>
      ) : (
        <>
          <div className="dashboard-page__grid dashboard-page__grid--admin analytics-dashboard__cards">
            {adminCards.map((card) => {
              const rawValue = analytics[card.key];
              const displayValue = card.format ? card.format(rawValue) : rawValue;

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

          <div className="analytics-dashboard__charts">
            <article className="analytics-chart">
              <header className="analytics-chart__header">
                <h2>Monthly Registrations</h2>
                <p>Last 6 months</p>
              </header>
              <div className="analytics-chart__body">
                {monthlyChartData && (
                  <Bar data={monthlyChartData} options={barChartOptions} />
                )}
              </div>
            </article>

            <article className="analytics-chart">
              <header className="analytics-chart__header">
                <h2>Popular Categories</h2>
                <p>By event count</p>
              </header>
              <div className="analytics-chart__body analytics-chart__body--donut">
                {categoryChartData && (
                  <Doughnut data={categoryChartData} options={doughnutChartOptions} />
                )}
              </div>
            </article>

            <article className="analytics-chart analytics-chart--wide">
              <header className="analytics-chart__header">
                <h2>Attendance Trend</h2>
                <p>Registered vs checked in</p>
              </header>
              <div className="analytics-chart__body">
                {attendanceTrendData && (
                  <Line data={attendanceTrendData} options={lineChartOptions} />
                )}
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  );
}

export default Dashboard;
