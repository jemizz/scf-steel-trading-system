// topbar.js (FULL UPDATED - inject topbar.html + datetime + dropdowns + modal loader for quick pages)
(() => {
  const host = document.getElementById("topbar");
  if (!host) return;

  let dateTimer = null;

  // Allow custom path when pages are in subfolders:
  // <div id="topbar" data-topbar-src="../topbar.html"></div>
  const TOPBAR_SRC = host.dataset.topbarSrc || "topbar.html";

  // Quick access content sources (edit paths if needed)
  const QUICK_PAGES = {
    transaction: "new-transaction.html",
    purchaseOrder: "new-purchase-order.html",
    stockIn: "stock-in.html",
    stockOut: "stock-out.html",
    addProduct: "add-product.html",
  };

  // ----------------------------
  // Modal system (built-in)
  // ----------------------------
  const MODAL_OVERLAY_ID = "tbModalOverlay";

  function ensureModalStyles() {
    if (document.getElementById("tbModalStyles")) return;

    const style = document.createElement("style");
    style.id = "tbModalStyles";
    style.textContent = `
      .tb-modal-overlay[hidden] { display: none !important; }
      .tb-modal-overlay{
        position: fixed; inset: 0;
        background: rgba(0,0,0,.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 24px;
      }
      .tb-modal{
        width: min(1100px, 96vw);
        max-height: 92vh;
        overflow: hidden;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,.35);
        display: flex;
        flex-direction: column;
      }
      .tb-modal-header{
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(0,0,0,.08);
      }
      .tb-modal-title{
        font-size: 16px;
        font-weight: 700;
      }
      .tb-modal-close{
        width: 36px; height: 36px;
        border: 1px solid rgba(0,0,0,.15);
        background: #fff;
        border-radius: 10px;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
      }
      .tb-modal-body{
        padding: 16px;
        overflow: auto;
      }
      body.tb-modal-open { overflow: hidden; }
    `;
    document.head.appendChild(style);
  }

  function ensureModalShell() {
    let overlay = document.getElementById(MODAL_OVERLAY_ID);
    if (overlay) return overlay;

    ensureModalStyles();

    overlay = document.createElement("div");
    overlay.id = MODAL_OVERLAY_ID;
    overlay.className = "tb-modal-overlay";
    overlay.hidden = true;

    overlay.innerHTML = `
      <div class="tb-modal" role="dialog" aria-modal="true" aria-label="Quick modal">
        <div class="tb-modal-header">
          <div class="tb-modal-title" id="tbModalTitle"></div>
          <button type="button" class="tb-modal-close" id="tbModalCloseBtn" aria-label="Close">×</button>
        </div>
        <div class="tb-modal-body" id="tbModalBody"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Close when clicking outside modal
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    // Close button
    overlay.querySelector("#tbModalCloseBtn").addEventListener("click", closeModal);

    // Escape to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    return overlay;
  }

  function closeModal() {
    const overlay = document.getElementById(MODAL_OVERLAY_ID);
    if (!overlay) return;

    overlay.hidden = true;
    document.body.classList.remove("tb-modal-open");

    const body = overlay.querySelector("#tbModalBody");
    if (body) body.innerHTML = "";
  }

  async function openModalFromUrl(url, title = "") {
    const overlay = ensureModalShell();
    const titleEl = overlay.querySelector("#tbModalTitle");
    const bodyEl = overlay.querySelector("#tbModalBody");

    if (titleEl) titleEl.textContent = title || "";
    if (bodyEl) bodyEl.innerHTML = "Loading...";

    overlay.hidden = false;
    document.body.classList.add("tb-modal-open");

    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(`Failed to load: ${url} (${r.status})`);

      const html = await r.text();

      // If the file is a full HTML document, get only <body> content
      const doc = new DOMParser().parseFromString(html, "text/html");
      const content = doc.body ? doc.body.innerHTML : html;

      bodyEl.innerHTML = content;

      // Optional: if your loaded content has a close button, you can add:
      // <button data-tb-close>Close</button>
      bodyEl.querySelectorAll("[data-tb-close]").forEach((el) => {
        el.addEventListener("click", closeModal);
      });

      // Focus close button for accessibility
      overlay.querySelector("#tbModalCloseBtn")?.focus();
    } catch (err) {
      console.error("[topbar] Modal load error:", err);

      // Fallback: navigate to the page if modal load fails
      window.location.href = url;
    }
  }

  // Define defaults ONLY if user didn't define them already
  function defineDefaultQuickFunctions() {
    if (typeof window.openNewTransactionModal !== "function") {
      window.openNewTransactionModal = () =>
        openModalFromUrl(QUICK_PAGES.transaction, "New Transaction");
    }

    if (typeof window.openNewPurchaseOrderModal !== "function") {
      window.openNewPurchaseOrderModal = () =>
        openModalFromUrl(QUICK_PAGES.purchaseOrder, "New Purchase Order");
    }

    if (typeof window.openStockInModal !== "function") {
      window.openStockInModal = () =>
        openModalFromUrl(QUICK_PAGES.stockIn, "Stock In");
    }

    if (typeof window.openStockOutModal !== "function") {
      window.openStockOutModal = () =>
        openModalFromUrl(QUICK_PAGES.stockOut, "Stock Out");
    }

    if (typeof window.openAddProductModal !== "function") {
      window.openAddProductModal = () =>
        openModalFromUrl(QUICK_PAGES.addProduct, "Add Product");
    }
  }

  // ----------------------------
  // Topbar behaviors
  // ----------------------------
  function setPageTitle() {
    const title = host.dataset.pageTitle || "Dashboard";
    const titleEl = host.querySelector("#topbarPageTitle");
    if (titleEl) titleEl.textContent = title;
  }

  function initDateTime() {
    const dateEl = host.querySelector("#currentDate");
    const timeEl = host.querySelector("#currentTime");
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

    update();
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

    const safeBind = (id, fnName) => {
      const el = host.querySelector(`#${id}`);
      if (!el) return;

      el.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof window[fnName] === "function") {
          window[fnName]();
        } else {
          console.warn(`[topbar] Missing function: ${fnName}`);
        }
        close();
      });
    };

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

    const markAllBtn = host.querySelector("#markAllReadBtn");
    if (markAllBtn) {
      markAllBtn.addEventListener("click", () => {
        if (typeof window.markAllNotificationsRead === "function") {
          window.markAllNotificationsRead();
        }
        close();
      });
    }
  }

  // Load topbar.html then init
  fetch(TOPBAR_SRC)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${TOPBAR_SRC}`);
      return r.text();
    })
    .then((html) => {
      host.innerHTML = html;

      setPageTitle();

      // Important: define default modal openers before binding click handlers
      defineDefaultQuickFunctions();

      initQuickAccess();
      initNotifications();
      initDateTime();
    })
    .catch((err) => {
      console.error("Topbar load error:", err);
    });
})();