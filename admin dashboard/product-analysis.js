// =========================
// PRODUCT ANALYSIS (UI ONLY)
// =========================

document.addEventListener("DOMContentLoaded", () => {
  const paSearch = document.getElementById("paSearch");

  // Top recommendations section
  const paRecoGrid = document.getElementById("paRecoGrid");
  const paRecoEmptyState = document.getElementById("paRecoEmptyState");

  // Table section
  const paTableBody = document.getElementById("paTableBody");
  const paEmptyState = document.getElementById("paEmptyState");

  const visibleCount = document.getElementById("visibleCount");
  const totalCount = document.getElementById("totalCount");

  function renderEmptyUI() {
    // Hide top cards grid (no data)
    if (paRecoGrid) {
      paRecoGrid.innerHTML = "";
      paRecoGrid.style.display = "none";
    }
    if (paRecoEmptyState) paRecoEmptyState.style.display = "flex";

    // Table empty
    if (paTableBody) paTableBody.innerHTML = "";
    if (paEmptyState) paEmptyState.style.display = "flex";

    // Counts
    if (visibleCount) visibleCount.textContent = "0";
    if (totalCount) totalCount.textContent = "0";
  }

  if (paSearch) paSearch.addEventListener("input", renderEmptyUI);

  renderEmptyUI();
});