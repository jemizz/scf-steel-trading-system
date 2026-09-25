// Inventory Reports page JS (NO demo data)

const printBtn = document.getElementById("printBtn");
const exportBtn = document.getElementById("exportBtn");

if (printBtn) printBtn.addEventListener("click", () => window.print());

if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    alert("Export clicked (Inventory)");
  });
}
