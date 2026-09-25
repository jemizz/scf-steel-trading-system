const printBtn = document.getElementById("printBtn");
const exportBtn = document.getElementById("exportBtn");

if (printBtn) printBtn.addEventListener("click", () => window.print());

if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    alert("Export clicked (Fabrication)");
  });
}
