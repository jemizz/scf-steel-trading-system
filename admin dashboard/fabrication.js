// =========================
// FABRICATION (UI ONLY)
// =========================

document.addEventListener("DOMContentLoaded", () => {

  // SUMMARY
  const pendingCount = document.getElementById("pendingCount");
  const scheduledCount = document.getElementById("scheduledCount");
  const inProgressCount = document.getElementById("inProgressCount");
  const completedCount = document.getElementById("completedCount");

  // TABLE + EMPTY
  const fabTableBody = document.getElementById("fabTableBody");
  const fabEmptyState = document.getElementById("fabEmptyState");

  // FOOTER COUNTS
  const totalFabCount = document.getElementById("totalFabCount");
  const visibleFabCount = document.getElementById("visibleFabCount");

  // CONTROLS
  const fabSearch = document.getElementById("fabSearch");
  const priorityFilter = document.getElementById("priorityFilter");
  const statusFilter = document.getElementById("statusFilter");

  // PAGINATION
  const previousPage = document.getElementById("previousPage");
  const nextPage = document.getElementById("nextPage");
  const currentPage = document.getElementById("currentPage");

  // BUTTON
  const newRequestBtn = document.getElementById("newRequestBtn");

  function renderEmptyUI() {
    // summary
    if (pendingCount) pendingCount.textContent = "0";
    if (scheduledCount) scheduledCount.textContent = "0";
    if (inProgressCount) inProgressCount.textContent = "0";
    if (completedCount) completedCount.textContent = "0";

    // footer
    if (totalFabCount) totalFabCount.textContent = "0";
    if (visibleFabCount) visibleFabCount.textContent = "0";

    // rows
    if (fabTableBody) fabTableBody.innerHTML = "";

    // empty state visible
    if (fabEmptyState) fabEmptyState.style.display = "flex";

    // pagination disabled
    if (previousPage) previousPage.disabled = true;
    if (nextPage) nextPage.disabled = true;
    if (currentPage) currentPage.textContent = "1";
  }

  // keep UI stable (no data yet)
  if (fabSearch) fabSearch.addEventListener("input", renderEmptyUI);
  if (priorityFilter) priorityFilter.addEventListener("change", renderEmptyUI);
  if (statusFilter) statusFilter.addEventListener("change", renderEmptyUI);

  if (newRequestBtn) {
    newRequestBtn.addEventListener("click", () => {
      console.log("New Request clicked (UI only).");
    });
  }

  renderEmptyUI();
});