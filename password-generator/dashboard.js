"use strict";

// This key is shared with script.js. Records contain metadata, never passwords.
const ANALYTICS_STORAGE_KEY = "northstar.passwordGenerator.analytics.v1";
const chartInstances = {};
const strengthColors = {
  Weak: "#ff7185",
  Medium: "#ffb86b",
  Strong: "#63dfa7",
};
const lengthBuckets = [
  { label: "6-9", min: 6, max: 9 },
  { label: "10-13", min: 10, max: 13 },
  { label: "14-17", min: 14, max: 17 },
  { label: "18-23", min: 18, max: 23 },
  { label: "24-32", min: 24, max: 32 },
  { label: "33-48", min: 33, max: 48 },
  { label: "49-64", min: 49, max: 64 },
];

// Ignore malformed localStorage data instead of breaking the dashboard.
function readAnalytics() {
  try {
    const records = JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) || "[]");
    if (!Array.isArray(records)) {
      return [];
    }

    return records.filter((record) =>
      record
      && /^\d{4}-\d{2}-\d{2}$/.test(record.date)
      && Number.isInteger(record.length)
      && record.length >= 6
      && record.length <= 64
      && Object.hasOwn(strengthColors, record.strength)
      && Number.isFinite(Date.parse(record.timestamp))
    );
  } catch (error) {
    console.warn("Password analytics could not be read:", error);
    return [];
  }
}

function updateSummary(records) {
  const counts = records.reduce((summary, record) => {
    summary[record.strength] += 1;
    summary.length += record.length;
    return summary;
  }, { Weak: 0, Medium: 0, Strong: 0, length: 0 });

  document.querySelector("#totalPasswords").textContent = records.length.toLocaleString();
  document.querySelector("#strongPasswords").textContent = counts.Strong.toLocaleString();
  document.querySelector("#mediumPasswords").textContent = counts.Medium.toLocaleString();
  document.querySelector("#weakPasswords").textContent = counts.Weak.toLocaleString();
  document.querySelector("#averageLength").textContent = records.length
    ? (counts.length / records.length).toFixed(1)
    : "--";
  document.querySelector("#emptyState").hidden = records.length > 0;
  document.querySelector("#lastUpdated").textContent = records.length
    ? `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Waiting for activity";
}

function destroyCharts() {
  Object.values(chartInstances).forEach((chart) => chart.destroy());
  Object.keys(chartInstances).forEach((key) => delete chartInstances[key]);
}

function axisOptions() {
  const tickColor = "#8fa1b3";
  const gridColor = "rgba(158, 180, 203, 0.1)";
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 550 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#172331",
        borderColor: "rgba(152, 182, 208, 0.2)",
        borderWidth: 1,
        titleColor: "#f0f5fa",
        bodyColor: "#b5c5d3",
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: gridColor, drawTicks: false },
        border: { color: gridColor },
        ticks: { color: tickColor, maxRotation: 0, autoSkip: true },
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor, drawTicks: false },
        border: { display: false },
        ticks: { color: tickColor, precision: 0, padding: 9 },
      },
    },
  };
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function createCharts(records) {
  destroyCharts();
  const alert = document.querySelector("#dashboardAlert");

  if (typeof window.Chart === "undefined") {
    alert.textContent = "Chart.js could not load. Check your connection to view the analytics charts.";
    alert.hidden = false;
    return;
  }
  alert.hidden = true;

  const chartDates = [...new Set(records.map((record) => record.date))].sort();
  const chartLabels = chartDates.map(formatDate);
  const dailyCounts = chartDates.map((date) => records.filter((record) => record.date === date).length);
  const dailyStrongCounts = chartDates.map((date) => records.filter(
    (record) => record.date === date && record.strength === "Strong",
  ).length);
  const strengthCounts = [
    records.filter((record) => record.strength === "Weak").length,
    records.filter((record) => record.strength === "Medium").length,
    records.filter((record) => record.strength === "Strong").length,
  ];

  chartInstances.strongByDay = new Chart(document.querySelector("#strongByDayChart"), {
    type: "bar",
    data: {
      labels: chartLabels,
      datasets: [{
        label: "Strong passwords",
        data: dailyStrongCounts,
        backgroundColor: "rgba(99, 223, 167, 0.72)",
        borderColor: "#63dfa7",
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 34,
      }],
    },
    options: {
      ...axisOptions(),
      scales: {
        ...axisOptions().scales,
        x: { ...axisOptions().scales.x, title: { display: true, text: "Date", color: "#91a2b4" } },
        y: { ...axisOptions().scales.y, title: { display: true, text: "Strong passwords", color: "#91a2b4" } },
      },
    },
  });

  chartInstances.strength = new Chart(document.querySelector("#strengthChart"), {
    type: "doughnut",
    data: {
      labels: ["Weak", "Medium", "Strong"],
      datasets: [{
        data: strengthCounts,
        backgroundColor: [strengthColors.Weak, strengthColors.Medium, strengthColors.Strong],
        borderColor: "#111a26",
        borderWidth: 4,
        hoverOffset: 7,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      animation: { duration: 550 },
      plugins: {
        legend: { position: "bottom", labels: { color: "#a5b4c2", usePointStyle: true, pointStyle: "circle", padding: 18, boxWidth: 7 } },
        tooltip: axisOptions().plugins.tooltip,
      },
    },
  });

  const lengthCounts = lengthBuckets.map((bucket) => records.filter(
    (record) => record.length >= bucket.min && record.length <= bucket.max,
  ).length);
  chartInstances.length = new Chart(document.querySelector("#lengthChart"), {
    type: "pie",
    data: {
      labels: lengthBuckets.map((bucket) => `${bucket.label} characters`),
      datasets: [{
        data: lengthCounts,
        backgroundColor: ["#62d4d0", "#5da9ef", "#8c8cf4", "#b28aea", "#e28ac2", "#f19b79", "#e3c66b"],
        borderColor: "#111a26",
        borderWidth: 3,
        hoverOffset: 7,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 550 },
      plugins: {
        legend: { position: "bottom", labels: { color: "#a5b4c2", usePointStyle: true, pointStyle: "circle", padding: 12, boxWidth: 7, font: { size: 9 } } },
        tooltip: axisOptions().plugins.tooltip,
      },
    },
  });

  chartInstances.trend = new Chart(document.querySelector("#trendChart"), {
    type: "line",
    data: {
      labels: chartLabels,
      datasets: [{
        label: "Passwords generated",
        data: dailyCounts,
        borderColor: "#8f83ff",
        backgroundColor: "rgba(143, 131, 255, 0.13)",
        pointBackgroundColor: "#71d9e5",
        pointBorderColor: "#111a26",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.34,
      }],
    },
    options: {
      ...axisOptions(),
      scales: {
        ...axisOptions().scales,
        x: { ...axisOptions().scales.x, title: { display: true, text: "Date", color: "#91a2b4" } },
        y: { ...axisOptions().scales.y, title: { display: true, text: "Generations", color: "#91a2b4" } },
      },
    },
  });
}

// Refresh the cards and charts from the current browser-local data.
function renderDashboard() {
  const records = readAnalytics();
  updateSummary(records);
  createCharts(records);
}

document.querySelector("#resetAnalytics").addEventListener("click", () => {
  if (!window.confirm("Reset all password generation analytics stored in this browser?")) {
    return;
  }

  localStorage.removeItem(ANALYTICS_STORAGE_KEY);
  renderDashboard();
});

document.querySelector("#downloadAnalytics").addEventListener("click", () => {
  const records = readAnalytics();
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `password-generator-analytics-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
});

// Storage events keep an open dashboard in sync with generation in another tab.
window.addEventListener("storage", (event) => {
  if (event.key === ANALYTICS_STORAGE_KEY || event.key === null) {
    renderDashboard();
  }
});

window.addEventListener("focus", renderDashboard);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    renderDashboard();
  }
});

renderDashboard();