// =========================
// Sales Reports page JS (NO DEMO DATA)
// =========================

const printBtn = document.getElementById("printBtn");
const exportBtn = document.getElementById("exportBtn");

if (printBtn) printBtn.addEventListener("click", () => window.print());

if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    // Replace with real export logic for SALES (CSV/PDF/etc.)
    alert("Export clicked (Sales)");
  });
}

/* =========================
   SHOW EMPTY STATES (until DB integration)
========================= */
function showEmptyState(chartId, emptyId) {
  const chart = document.getElementById(chartId);
  const empty = document.getElementById(emptyId);

  if (chart) chart.classList.add("is-hidden");     // hide chart container
  if (empty) empty.classList.remove("is-hidden");  // show empty state
}

document.addEventListener("DOMContentLoaded", () => {
  // Monthly Sales Overview
  showEmptyState("salesMonthlyChart", "salesMonthlyEmpty");

  // Top-Selling Products (by Revenue)
  showEmptyState("salesTopProductsChart", "salesTopProductsEmpty");

  // Transactions: your HTML already shows the empty state by default.
  // Later, when you load rows into tbody, you can hide #salesTransactionsEmpty.
});