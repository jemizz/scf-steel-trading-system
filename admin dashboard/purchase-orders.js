// =========================
// PURCHASE ORDERS (UI ONLY)
// =========================

document.addEventListener("DOMContentLoaded", () => {

  // SUMMARY
  const pendingCount = document.getElementById("pendingCount");
  const orderedCount = document.getElementById("orderedCount");
  const receivedCount = document.getElementById("receivedCount");
  const cancelledCount = document.getElementById("cancelledCount");

  // TABLE + EMPTY
  const poTableBody = document.getElementById("poTableBody");
  const poEmptyState = document.getElementById("poEmptyState");

  // FOOTER COUNTS
  const totalPoCount = document.getElementById("totalPoCount");
  const visiblePoCount = document.getElementById("visiblePoCount");

  // CONTROLS
  const poSearch = document.getElementById("poSearch");
  const typeFilter = document.getElementById("typeFilter");
  const statusFilter = document.getElementById("statusFilter");

  // PAGINATION
  const previousPage = document.getElementById("previousPage");
  const nextPage = document.getElementById("nextPage");
  const currentPage = document.getElementById("currentPage");

  // BUTTON
  const createPoBtn = document.getElementById("createPoBtn");

  function renderEmptyUI() {
    // summary counts
    if (pendingCount) pendingCount.textContent = "0";
    if (orderedCount) orderedCount.textContent = "0";
    if (receivedCount) receivedCount.textContent = "0";
    if (cancelledCount) cancelledCount.textContent = "0";

    // footer counts
    if (totalPoCount) totalPoCount.textContent = "0";
    if (visiblePoCount) visiblePoCount.textContent = "0";

    // no rows
    if (poTableBody) poTableBody.innerHTML = "";

    // show empty state
    if (poEmptyState) poEmptyState.style.display = "flex";

    // pagination disabled
    if (previousPage) previousPage.disabled = true;
    if (nextPage) nextPage.disabled = true;
    if (currentPage) currentPage.textContent = "1";
  }

  // Keep UI stable (no data yet)
  if (poSearch) poSearch.addEventListener("input", renderEmptyUI);
  if (typeFilter) typeFilter.addEventListener("change", renderEmptyUI);
  if (statusFilter) statusFilter.addEventListener("change", renderEmptyUI);

  if (createPoBtn) {
    createPoBtn.addEventListener("click", () => {
      console.log("Create PO clicked (UI only).");
    });
  }

  renderEmptyUI();
});