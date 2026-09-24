// =========================
// SUPPLIERS (UI ONLY - NO DATA YET)
// =========================

document.addEventListener("DOMContentLoaded", () => {
  const supplierRegisteredCount = document.getElementById("supplierRegisteredCount");
  const totalSupplierCount = document.getElementById("totalSupplierCount");
  const visibleSupplierCount = document.getElementById("visibleSupplierCount");

  const supplierTableBody = document.getElementById("supplierTableBody");
  const supplierEmptyState = document.getElementById("supplierEmptyState");

  const supplierSearch = document.getElementById("supplierSearch");
  const statusFilter = document.getElementById("statusFilter");

  const addSupplierBtn = document.getElementById("addSupplierBtn");

  const previousPage = document.getElementById("previousPage");
  const nextPage = document.getElementById("nextPage");
  const currentPage = document.getElementById("currentPage");

  function renderEmptyState() {
    // No data yet
    if (supplierRegisteredCount) supplierRegisteredCount.textContent = "0";
    if (totalSupplierCount) totalSupplierCount.textContent = "0";
    if (visibleSupplierCount) visibleSupplierCount.textContent = "0";

    if (supplierTableBody) supplierTableBody.innerHTML = "";

    if (supplierEmptyState) supplierEmptyState.style.display = "flex";

    // Pagination disabled (UI only)
    if (previousPage) previousPage.disabled = true;
    if (nextPage) nextPage.disabled = true;
    if (currentPage) currentPage.textContent = "1";
  }

  if (supplierSearch) supplierSearch.addEventListener("input", renderEmptyState);
  if (statusFilter) statusFilter.addEventListener("change", renderEmptyState);

  if (addSupplierBtn) {
    addSupplierBtn.addEventListener("click", () => {
      // connect to modal/form later
      console.log("Add Supplier clicked (UI only).");
    });
  }

  renderEmptyState();
});