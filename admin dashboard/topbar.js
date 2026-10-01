// topbar.js (FULL UPDATED - safe init + fixes loading date/time)
(() => {
  const host = document.getElementById("topbar");
  if (!host) return;

  let dateTimer = null;

  function setPageTitle() {
    const title = host.dataset.pageTitle || "Dashboard";
    const titleEl = host.querySelector("#topbarPageTitle");
    if (titleEl) titleEl.textContent = title;
  }

  function initDateTime() {
    const dateEl = host.querySelector("#currentDate");
    const timeEl = host.querySelector("#currentTime");

    // If not found, don't throw error
    if (!dateEl || !timeEl) return;

    const update = () => {
      const now = new Date();

      dateEl.textContent = now.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      timeEl.textContent = now.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    // Update immediately
    update();

    // Clear previous timer (important when re-initializing)
    if (dateTimer) clearInterval(dateTimer);

    dateTimer = setInterval(update, 1000);
  }

  function initQuickAccess() {
    const btn = host.querySelector("#quickAccessBtn");
    const menu = host.querySelector("#quickAccessMenu");
    if (!btn || !menu) return;

    const close = () => {
      menu.classList.remove("show");
      btn.classList.remove("active");
    };

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("show");
      btn.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".quick-access")) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    // SAFE binding to buttons (won't crash if function doesn't exist)
    const safeBind = (id, fnName) => {
      const el = host.querySelector(`#${id}`);
      if (!el) return;

      el.addEventListener("click", () => {
        if (typeof window[fnName] === "function") {
          window[fnName]();
        }
      });
    };

    // If you already have these global functions, they will run.
    // If not, nothing happens (no crash).
    safeBind("quickNewTransaction", "openNewTransactionModal");
    safeBind("quickNewPurchaseOrder", "openNewPurchaseOrderModal");
    safeBind("quickStockIn", "openStockInModal");
    safeBind("quickStockOut", "openStockOutModal");
    safeBind("quickAddProduct", "openAddProductModal");
  }

  function initNotifications() {
    const btn = host.querySelector("#notificationBtn");
    const menu = host.querySelector("#notificationMenu");
    if (!btn || !menu) return;

    const close = () => {
      menu.classList.remove("show");
      btn.classList.remove("active");
    };

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("show");
      btn.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".notifications")) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    // Mark all read button (optional - safe)
    const markAllBtn = host.querySelector("#markAllReadBtn");
    if (markAllBtn) {
      markAllBtn.addEventListener("click", () => {
        if (typeof window.markAllNotificationsRead === "function") {
          window.markAllNotificationsRead();
        }
      });
    }
  }

  // Load and inject topbar.html first, then init behaviors
  fetch("topbar.html")
    .then((r) => {
      if (!r.ok) throw new Error("Failed to load topbar.html");
      return r.text();
    })
    .then((html) => {
      host.innerHTML = html;

      setPageTitle();
      initQuickAccess();
      initNotifications();
      initDateTime();
    })
    .catch((err) => {
      console.error("Topbar load error:", err);
    });
})();