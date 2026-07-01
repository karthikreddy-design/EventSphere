export const CHART_COLORS = {
  primary: "#3b82f6",
  primarySoft: "rgba(59, 130, 246, 0.14)",
  success: "#10b981",
  successSoft: "rgba(16, 185, 129, 0.1)",
  palette: ["#3b82f6", "#6366f1", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6"],
  grid: "#eef2f7",
  tick: "#94a3b8",
  tooltipBg: "#0f172a",
};

export const shortMonthLabel = (label) => label.split(" ")[0];

const baseFont = {
  family: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  size: 11,
};

const baseTicks = {
  color: CHART_COLORS.tick,
  font: baseFont,
  padding: 6,
  maxRotation: 45,
  minRotation: 0,
  autoSkip: true,
  maxTicksLimit: 6,
};

const baseGrid = {
  color: CHART_COLORS.grid,
  drawBorder: false,
  lineWidth: 1,
};

export const chartBodyOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    tooltip: {
      backgroundColor: CHART_COLORS.tooltipBg,
      titleColor: "#f8fafc",
      bodyColor: "#e2e8f0",
      padding: 10,
      cornerRadius: 8,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      usePointStyle: true,
      titleFont: { ...baseFont, size: 12, weight: "600" },
      bodyFont: baseFont,
    },
    legend: {
      labels: {
        color: "#64748b",
        usePointStyle: true,
        pointStyle: "circle",
        boxWidth: 8,
        boxHeight: 8,
        padding: 14,
        font: { ...baseFont, size: 11, weight: "500" },
      },
    },
  },
};

export const cartesianScales = {
  x: {
    grid: { display: false, drawBorder: false },
    border: { display: false },
    ticks: baseTicks,
  },
  y: {
    beginAtZero: true,
    grid: baseGrid,
    border: { display: false },
    ticks: {
      ...baseTicks,
      precision: 0,
      padding: 8,
    },
  },
};

export const barChartOptions = {
  ...chartBodyOptions,
  plugins: {
    ...chartBodyOptions.plugins,
    legend: { display: false },
  },
  scales: cartesianScales,
  datasets: {
    bar: {
      maxBarThickness: 32,
      borderRadius: 6,
      borderSkipped: false,
    },
  },
};

export const lineChartOptions = {
  ...chartBodyOptions,
  plugins: {
    ...chartBodyOptions.plugins,
    legend: {
      ...chartBodyOptions.plugins.legend,
      position: "bottom",
    },
  },
  scales: cartesianScales,
  elements: {
    line: {
      borderWidth: 2,
      tension: 0.35,
    },
    point: {
      radius: 3,
      hoverRadius: 5,
      borderWidth: 2,
      hitRadius: 8,
    },
  },
};

export const doughnutChartOptions = {
  ...chartBodyOptions,
  cutout: "72%",
  plugins: {
    ...chartBodyOptions.plugins,
    legend: {
      ...chartBodyOptions.plugins.legend,
      position: "bottom",
    },
  },
};
