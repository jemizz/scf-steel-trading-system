(() => {
  "use strict";

  /*
   * Sales records will come from your backend later.
   * No sample transactions are added automatically.
   */
  let salesTransactions = [];

  const elements = {
    search: document.getElementById("salesSearch"),
    type: document.getElementById("typeFilter"),
    status: document.getElementById("statusFilter"),

    tableBody: document.getElementById("salesTableBody"),
    emptyState: document.getElementById("emptyState"),
    resultCount: document.getElementById("resultCount"),
    tableSummary: document.getElementById("tableSummary"),

    todaySales: document.getElementById("todaySales"),
    totalTransactions: document.getElementById("totalTransactions"),
    pendingPayment: document.getElementById("pendingPayment"),
    pendingCount: document.getElementById("pendingCount"),
    wholesaleCount: document.getElementById("wholesaleCount"),

    dialog: document.getElementById("saleDialog"),
    details: document.getElementById("saleDetails")
  };

  const currencyFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2
  });

  const dateFormatter = new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });

  /*
   * EXPECTED RECORD FORMAT
   *
   * id          : Unique transaction ID
   * date        : Sale date in YYYY-MM-DD format
   * customer    : Customer name
   * type        : "Retail" or "Wholesale"
   * items       : Number of items
   * total       : Total sale amount
   * amountPaid  : Actual amount already paid
   * method      : Payment method
   * reference   : Receipt or invoice reference
   *
   * total and amountPaid must be numbers without commas or ₱.
   * Payment status and remaining balance are calculated below.
   */

  function formatCurrency(amount) {
    return currencyFormatter.format(amount);
  }

  function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return dateFormatter.format(date);
  }

  function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getBalance(sale) {
    return Math.max(0, sale.total - sale.amountPaid);
  }

  function getPaymentStatus(sale) {
    if (getBalance(sale) === 0) {
      return "Paid";
    }

    if (sale.amountPaid > 0) {
      return "Partial";
    }

    return "Pending";
  }

  function escapeHtml(value) {
    const characters = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return String(value ?? "").replace(
      /[&<>"']/g,
      (character) => characters[character]
    );
  }

  /* =========================
     SUMMARY CARDS
  ========================= */

  function updateSummary() {
    const today = getTodayDate();

    // Matches the card's "Completed today" description.
    const todayTotal = salesTransactions
      .filter((sale) => {
        return (
          sale.date === today &&
          getPaymentStatus(sale) === "Paid"
        );
      })
      .reduce((total, sale) => total + sale.total, 0);

    const unpaidTransactions = salesTransactions.filter(
      (sale) => getBalance(sale) > 0
    );

    // Partial payments contribute only their remaining balance.
    const outstandingBalance = unpaidTransactions.reduce(
      (total, sale) => total + getBalance(sale),
      0
    );

    const wholesaleTransactions = salesTransactions.filter(
      (sale) => sale.type === "Wholesale"
    );

    elements.todaySales.textContent = formatCurrency(todayTotal);

    elements.totalTransactions.textContent =
      salesTransactions.length;

    elements.pendingPayment.textContent =
      formatCurrency(outstandingBalance);

    elements.pendingCount.textContent =
      `${unpaidTransactions.length} transactions`;

    elements.wholesaleCount.textContent =
      wholesaleTransactions.length;
  }

  /* =========================
     SEARCH AND FILTERS
  ========================= */

  function getFilteredTransactions() {
    const searchText = elements.search.value.trim().toLowerCase();
    const selectedType = elements.type.value;
    const selectedStatus = elements.status.value;

    return salesTransactions.filter((sale) => {
      const paymentStatus = getPaymentStatus(sale);

      const searchableText = [
        sale.id,
        sale.customer,
        sale.reference
      ].join(" ").toLowerCase();

      const matchesSearch = searchableText.includes(searchText);

      const matchesType =
        selectedType === "all" ||
        sale.type === selectedType;

      const matchesStatus =
        selectedStatus === "all" ||
        paymentStatus === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }

  /* =========================
     EMPTY STATE
  ========================= */

  function updateEmptyState(visibleCount) {
    elements.emptyState.hidden = visibleCount > 0;

    if (visibleCount > 0) {
      return;
    }

    const title = elements.emptyState.querySelector("strong");
    const description = elements.emptyState.querySelector("p");

    if (salesTransactions.length === 0) {
      title.textContent = "No sales records yet";

      description.textContent =
        "Sales transactions will appear here once they are recorded.";
    } else {
      title.textContent = "No matching transactions";

      description.textContent =
        "Try a different search or change your filters.";
    }
  }

  /* =========================
     TRANSACTIONS TABLE
  ========================= */

  function renderSales() {
    const filteredTransactions = getFilteredTransactions();

    elements.tableBody.innerHTML = filteredTransactions
      .map((sale) => {
        const paymentStatus = getPaymentStatus(sale);
        const statusClass = paymentStatus.toLowerCase();

        return `
          <tr>
            <td>
              <span class="transaction-id">
                ${escapeHtml(sale.id)}
              </span>
            </td>

            <td>
              ${escapeHtml(formatDate(sale.date))}
            </td>

            <td>
              <span class="customer-name">
                ${escapeHtml(sale.customer)}
              </span>
            </td>

            <td>
              <span class="type-label">
                ${escapeHtml(sale.type)}
              </span>
            </td>

            <td>
              <span class="item-count">
                ${sale.items} items
              </span>
            </td>

            <td class="numeric">
              ${formatCurrency(sale.total)}
            </td>

            <td>
              <span class="status-badge status-${statusClass}">
                ${paymentStatus}
              </span>
            </td>

            <td class="action-cell">
              <button
                class="view-button"
                type="button"
                data-sale-id="${escapeHtml(sale.id)}"
                aria-label="View transaction ${escapeHtml(sale.id)}"
              >
                View
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    elements.resultCount.textContent =
      `${filteredTransactions.length} transactions`;

    elements.tableSummary.textContent =
      `Showing ${filteredTransactions.length} of ` +
      `${salesTransactions.length} transactions`;

    updateEmptyState(filteredTransactions.length);
  }

  /* =========================
     TRANSACTION DETAILS
  ========================= */

  function showSaleDetails(sale) {
    const fields = [
      ["Transaction ID", sale.id],
      ["Date", formatDate(sale.date)],
      ["Customer", sale.customer],
      ["Sale Type", sale.type],
      ["Items", `${sale.items} items`],
      ["Total Amount", formatCurrency(sale.total)],
      ["Amount Paid", formatCurrency(sale.amountPaid)],
      ["Remaining Balance", formatCurrency(getBalance(sale))],
      ["Payment Status", getPaymentStatus(sale)],
      ["Payment Method", sale.method || "—"],
      ["Reference", sale.reference || "—"]
    ];

    elements.details.innerHTML = fields
      .map(([label, value]) => {
        return `
          <div>
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(value)}</dd>
          </div>
        `;
      })
      .join("");

    elements.dialog.showModal();
  }

  /* =========================
     BACKEND CONNECTION POINT
  ========================= */

  function setTransactions(records) {
    if (!Array.isArray(records)) {
      throw new TypeError("Sales records must be an array.");
    }

    const transactionIds = new Set();

    // Validate all records before replacing the displayed data.
    const preparedRecords = records.map((record) => {
      if (!record || typeof record !== "object") {
        throw new TypeError("Each sales record must be an object.");
      }

      if (
        record.id == null ||
        String(record.id).trim() === "" ||
        typeof record.date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(record.date)
      ) {
        throw new Error("Each sale needs an ID and a YYYY-MM-DD date.");
      }

      const id = String(record.id);

      if (transactionIds.has(id)) {
        throw new Error(`Duplicate transaction ID: ${id}`);
      }

      transactionIds.add(id);

      if (!["Retail", "Wholesale"].includes(record.type)) {
        throw new Error(`Invalid sale type for transaction ${id}.`);
      }

      if (
        !Number.isFinite(record.total) ||
        !Number.isFinite(record.amountPaid) ||
        record.total < 0 ||
        record.amountPaid < 0 ||
        record.amountPaid > record.total
      ) {
        throw new Error(`Invalid payment amounts for transaction ${id}.`);
      }

      if (!Number.isInteger(record.items) || record.items < 0) {
        throw new Error(`Invalid item count for transaction ${id}.`);
      }

      return {
        ...record,
        id,
        customer: record.customer || "Walk-in Customer"
      };
    });

    salesTransactions = preparedRecords;

    if (elements.dialog.open) {
      elements.dialog.close();
    }

    updateSummary();
    renderSales();
  }

  /*
   * Your backend integration can call:
   *
   * window.SalesPage.setTransactions(recordsFromDatabase);
   *
   * Pass an empty array when there are no sales records.
   */
  window.SalesPage = {
    setTransactions
  };

  /* =========================
     EVENT LISTENERS
  ========================= */

  elements.search.addEventListener("input", renderSales);
  elements.type.addEventListener("change", renderSales);
  elements.status.addEventListener("change", renderSales);

  elements.tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sale-id]");

    if (!button) {
      return;
    }

    const selectedSale = salesTransactions.find(
      (sale) => sale.id === button.dataset.saleId
    );

    if (selectedSale) {
      showSaleDetails(selectedSale);
    }
  });

  elements.dialog.addEventListener("click", (event) => {
    if (event.target !== elements.dialog) {
      return;
    }

    const bounds = elements.dialog.getBoundingClientRect();

    const clickedOutside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (clickedOutside) {
      elements.dialog.close();
    }
  });

  /* =========================
     INITIAL PAGE DISPLAY
  ========================= */

  updateSummary();
  renderSales();
})();