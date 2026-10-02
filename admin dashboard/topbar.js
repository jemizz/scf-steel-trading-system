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
    stockIn: "stock-movements.html",
    stockOut: "stock-movements.html",
    addProduct: "add-product.html",
  };


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

  // =========================
// LOAD TRANSACTION / PO HTML
// =========================

const pendingModalLoads = new Map();

async function loadNativeModal(url, overlayId, initialize) {
    const existingOverlay = document.getElementById(overlayId);

    if (existingOverlay) {
        if (existingOverlay.dataset.initialized !== "true") {
            initialize();
            existingOverlay.dataset.initialized = "true";
        }

        return existingOverlay;
    }

    // Prevent duplicate HTML when a button is clicked repeatedly.
    if (pendingModalLoads.has(overlayId)) {
        return pendingModalLoads.get(overlayId);
    }

    const loading = (async () => {
        const response = await fetch(url, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(
                `Unable to load ${url}: HTTP ${response.status}`
            );
        }

        const html = await response.text();

        const parsed = new DOMParser().parseFromString(
            html,
            "text/html"
        );

        const modal = parsed.getElementById(overlayId);

        if (!modal) {
            throw new Error(
                `${url} is missing #${overlayId}`
            );
        }

        // Insert the actual modal directly into the page.
        // Do not place it inside the topbar's generic modal.
        modal.hidden = true;
        document.body.appendChild(modal);

        try {
            initialize();
            modal.dataset.initialized = "true";
        } catch (error) {
            modal.remove();
            throw error;
        }

        return modal;
    })();

    pendingModalLoads.set(overlayId, loading);

    try {
        return await loading;
    } finally {
        pendingModalLoads.delete(overlayId);
    }
}


// =========================
// QUICK ACCESS FUNCTIONS
// =========================

function defineDefaultQuickFunctions() {
    window.openNewTransactionModal = async function () {
        try {
            if (
                typeof window.initializeTransactionModal !==
                "function"
            ) {
                throw new Error(
                    "new-transaction.js is not loaded."
                );
            }

            const overlay = await loadNativeModal(
                QUICK_PAGES.transaction,
                "transactionOverlay",
                window.initializeTransactionModal
            );

            overlay.hidden = false;

            overlay.querySelector(
                "#closeTransactionBtn"
            )?.focus();
        } catch (error) {
            console.error(
                "Transaction modal error:",
                error
            );

            alert(
                "Unable to open New Transaction. " +
                "Check the browser console for details."
            );
        }
    };

    window.openNewPurchaseOrderModal = async function () {
        try {
            if (
                typeof window.initializePurchaseOrderModal !==
                "function" ||
                typeof window.openPurchaseOrderModal !==
                "function"
            ) {
                throw new Error(
                    "new-purchase-order.js is not loaded."
                );
            }

            const overlay = await loadNativeModal(
                QUICK_PAGES.purchaseOrder,
                "purchaseOrderOverlay",
                window.initializePurchaseOrderModal
            );

            overlay.hidden = false;

            // Your existing function resets the form,
            // adds .show, and prevents background scrolling.
            window.openPurchaseOrderModal();

            overlay.querySelector(
                "#closePurchaseOrder"
            )?.focus();
        } catch (error) {
            console.error(
                "Purchase order modal error:",
                error
            );

            alert(
                "Unable to open New Purchase Order. " +
                "Check the browser console for details."
            );
        }
    };

    if (typeof window.openStockInModal !== "function") {
        window.openStockInModal = () =>
            openModalFromUrl(
                QUICK_PAGES.stockIn,
                "Stock In"
            );
    }

    if (typeof window.openStockOutModal !== "function") {
        window.openStockOutModal = () =>
            openModalFromUrl(
                QUICK_PAGES.stockOut,
                "Stock Out"
            );
    }

    if (typeof window.openAddProductModal !== "function") {
        window.openAddProductModal = () =>
            openModalFromUrl(
                QUICK_PAGES.addProduct,
                "Add Product"
            );
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

  function isUnread(item) {
    return String(item && item.status || "").trim().toLowerCase() !== "read";
  }

  function notificationTime(value) {
    if (!value) return "";
    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  async function notificationRequest(action, payload = {}) {
    const body = new URLSearchParams();
    body.set("action", action);
    Object.entries(payload).forEach(([key, value]) => {
      body.set(key, value ?? "");
    });

    const response = await fetch("messages.php", {
      method: "POST",
      headers: { "Accept": "application/json" },
      body
    });
    const raw = await response.text();
    let data = null;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch (error) {
      throw new Error("messages.php did not return JSON.");
    }

    if (!response.ok || !data.success) {
      throw new Error((data && data.message) || "Unable to load notifications.");
    }

    return data;
  }

  // ----------------------------
  // Notification rendering (tabs: All / Inquiries / Alerts)
  // ----------------------------
  const MAX_INDIVIDUAL = 3;
  let notifMessages = [];
  let notifTab = "all";

  // Anything with type "alert" or "system" is an alert; the rest are inquiries.
  function isAlert(item) {
    const t = String(item && item.type || "").trim().toLowerCase();
    return t === "alert" || t === "system";
  }

  function timeValue(item) {
    const d = new Date(String(item && item.created_at || "").replace(" ", "T"));
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function buildNotificationRow({ title, text, time, unread, onClick }) {
    const row = document.createElement("div");
    row.className = "notification-item" + (unread ? " unread" : "");
    row.style.gridTemplateColumns = "minmax(0, 1fr) auto";

    const content = document.createElement("div");
    content.className = "notification-content";

    const strong = document.createElement("strong");
    strong.textContent = title;

    const p = document.createElement("p");
    p.textContent = text;

    content.append(strong, p);

    const meta = document.createElement("div");
    meta.className = "notification-meta";

    const t = document.createElement("span");
    t.className = "notification-time";
    t.textContent = time;
    meta.appendChild(t);

    if (unread) {
      const dot = document.createElement("span");
      dot.className = "notification-dot";
      meta.appendChild(dot);
    }

    row.append(content, meta);
    row.addEventListener("click", onClick);
    return row;
  }

  function drawNotificationList() {
    const list = host.querySelector("#notificationList");
    const empty = host.querySelector("#notificationEmpty");
    if (!list) return;

    list.querySelectorAll(".notification-item").forEach((el) => el.remove());

    const inquiries = notifMessages.filter((m) => !isAlert(m));
    const alerts = notifMessages.filter(isAlert);

    const entries = [];

    if (notifTab === "all" || notifTab === "inquiries") {
      const unreadInq = inquiries.filter(isUnread);

      if (unreadInq.length > MAX_INDIVIDUAL) {
        // More than 3 unread inquiries -> ONE grouped notification
        entries.push({
          sort: Math.max(...unreadInq.map(timeValue)),
          row: buildNotificationRow({
            title: `${unreadInq.length} new inquiries`,
            text: "You have new customer inquiries. Click to view all messages.",
            time: notificationTime(unreadInq[0].created_at),
            unread: true,
            onClick: () => { window.location.href = "messages.html"; }
          })
        });
      } else {
        inquiries.slice(0, MAX_INDIVIDUAL).forEach((item) => {
          entries.push({
            sort: timeValue(item),
            row: buildNotificationRow({
              title: item.name || "New inquiry",
              text: item.message || "Customer sent a message.",
              time: notificationTime(item.created_at),
              unread: isUnread(item),
              onClick: async () => {
                try {
                  if (isUnread(item)) {
                    await notificationRequest("set_status", { id: item.id, status: "read" });
                  }
                } catch (error) {
                  console.error(error);
                }
                window.location.href = "messages.html";
              }
            })
          });
        });
      }
    }

    if (notifTab === "all" || notifTab === "alerts") {
      alerts.slice(0, 12).forEach((item) => {
        entries.push({
          sort: timeValue(item),
          row: buildNotificationRow({
            title: item.name || item.title || "System alert",
            text: item.message || "",
            time: notificationTime(item.created_at),
            unread: isUnread(item),
            onClick: async () => {
              try {
                if (isUnread(item)) {
                  await notificationRequest("set_status", { id: item.id, status: "read" });
                }
              } catch (error) {
                console.error(error);
              }
              if (item.link) window.location.href = item.link;
              else loadTopbarNotifications();
            }
          })
        });
      });
    }

    entries.sort((x, y) => y.sort - x.sort);
    entries.forEach((entry) => list.appendChild(entry.row));

    if (empty) {
      empty.style.display = entries.length > 0 ? "none" : "flex";

      const label = empty.querySelector("strong");
      if (label) {
        label.textContent =
          notifTab === "inquiries" ? "No inquiries" :
          notifTab === "alerts" ? "No alerts" :
          "No notifications";
      }
    }
  }

  function renderTopbarNotifications(messages) {
    const badge = host.querySelector("#notificationBadge");
    const count = host.querySelector("#notificationCount");
    if (!badge) return;

    notifMessages = messages;

    const unread = messages.filter(isUnread);

    if (unread.length > 0) {
      badge.textContent = unread.length > 99 ? "99+" : String(unread.length);
      badge.classList.add("show");
    } else {
      badge.textContent = "";
      badge.classList.remove("show");
    }

    if (count) {
      count.textContent = `${unread.length} Unread`;
      count.classList.toggle("show", unread.length > 0);
    }

    drawNotificationList();
  }

  function initNotificationTabs() {
    const tabs = host.querySelectorAll(".notification-tab");

    tabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        e.stopPropagation();
        notifTab = tab.dataset.tab || "all";
        tabs.forEach((t) => t.classList.toggle("active", t === tab));
        drawNotificationList();
      });
    });
  }

  async function loadTopbarNotifications() {
    try {
      const data = await notificationRequest("list");
      renderTopbarNotifications(Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
      console.error("Topbar notification error:", error);
    }
  }

  window.markAllNotificationsRead = async function () {
    try {
      const data = await notificationRequest("list");
      const messages = Array.isArray(data.messages) ? data.messages : [];
      const unread = messages.filter(isUnread);

      await Promise.all(unread.map((item) => notificationRequest("set_status", {
        id: item.id,
        status: "read"
      })));

      await loadTopbarNotifications();
    } catch (error) {
      console.error(error);
    }
  };

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
      loadTopbarNotifications();
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".notifications")) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    const markAllBtn = host.querySelector("#markAllReadBtn");
    if (markAllBtn) {
      markAllBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await window.markAllNotificationsRead();
      });
    }

    initNotificationTabs();
    loadTopbarNotifications();
    if (window.__tbNotifTimer) clearInterval(window.__tbNotifTimer);
    window.__tbNotifTimer = setInterval(loadTopbarNotifications, 20000);
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