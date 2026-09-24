// =========================
// SETTINGS (UI ONLY)
// =========================

document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-btn");

  const panels = {
    account: document.getElementById("tab-account"),
    notification: document.getElementById("tab-notification"),
  };

  function showTab(tabName) {
    tabButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    Object.keys(panels).forEach((key) => {
      panels[key]?.classList.toggle("show", key === tabName);
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });

  // Save Notifications Settings (UI-only)
  const saveBtn = document.getElementById("saveNotificationSettings");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const values = {
        lowStock: !!document.getElementById("notifLowStock")?.checked,
        fabrication: !!document.getElementById("notifFabrication")?.checked,
        poDelivery: !!document.getElementById("notifPoDelivery")?.checked,
        dailySales: !!document.getElementById("notifDailySales")?.checked,
        paymentDue: !!document.getElementById("notifPaymentDue")?.checked,
      };

      console.log("Notification Settings (UI only):", values);
    });
  }

  // Default tab
  showTab("account");
});