// =========================
// STOCK REPLENISHMENT (UI ONLY)
// =========================

document.addEventListener("DOMContentLoaded", () => {
  // Summary counts
  const urgentCount = document.getElementById("urgentCount");
  const recommendedCount = document.getElementById("recommendedCount");
  const monitorCount = document.getElementById("monitorCount");
  const okCount = document.getElementById("okCount");

  // Recommendation cards
  const recoGrid = document.getElementById("recoGrid");
  const recoEmptyState = document.getElementById("recoEmptyState");

  // Table
  const srTableBody = document.getElementById("srTableBody");
  const srEmptyState = document.getElementById("srEmptyState");

  // Footer counts
  const totalCount = document.getElementById("totalCount");
  const visibleCount = document.getElementById("visibleCount");

  // Controls
  const srSearch = document.getElementById("srSearch");
  const categoryFilter = document.getElementById("categoryFilter");
  const statusFilter = document.getElementById("statusFilter");

  // Pagination
  const previousPage = document.getElementById("previousPage");
  const nextPage = document.getElementById("nextPage");
  const currentPage = document.getElementById("currentPage");

  function renderEmptyUI() {
    // counts (no data yet)
    if (urgentCount) urgentCount.textContent = "0";
    if (recommendedCount) recommendedCount.textContent = "0";
    if (monitorCount) monitorCount.textContent = "0";
    if (okCount) okCount.textContent = "0";

    // cards empty
    if (recoGrid) recoGrid.innerHTML = "";
    if (recoEmptyState) recoEmptyState.style.display = "flex";

    // table empty
    if (srTableBody) srTableBody.innerHTML = "";
    if (srEmptyState) srEmptyState.style.display = "flex";

    // footer counts
    if (totalCount) totalCount.textContent = "0";
    if (visibleCount) visibleCount.textContent = "0";

    // pagination disabled
    if (previousPage) previousPage.disabled = true;
    if (nextPage) nextPage.disabled = true;
    if (currentPage) currentPage.textContent = "1";
  }

  // keep UI stable (no data yet)
  if (srSearch) srSearch.addEventListener("input", renderEmptyUI);
  if (categoryFilter) categoryFilter.addEventListener("change", renderEmptyUI);
  if (statusFilter) statusFilter.addEventListener("change", renderEmptyUI);

  renderEmptyUI();
});