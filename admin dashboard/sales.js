// =========================
// DATE AND TIME
// =========================

function updateDateTime() {

    const now = new Date();

    const date = now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    const time = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

    document.getElementById("currentDate").textContent = date;
    document.getElementById("currentTime").textContent = time;
}


updateDateTime();

setInterval(updateDateTime, 1000);


// =========================
// SALES ELEMENTS
// =========================

const salesTableBody =
    document.getElementById("salesTableBody");

const emptyState =
    document.getElementById("salesEmptyState");

const totalSaleCount =
    document.getElementById("totalSaleCount");

const visibleSaleCount =
    document.getElementById("visibleSaleCount");

const salesSearch =
    document.getElementById("salesSearch");

const statusFilter =
    document.getElementById("statusFilter");

const paymentFilter =
    document.getElementById("paymentFilter");

const dateFilter =
    document.getElementById("dateFilter");


// =========================
// SUMMARY ELEMENTS
// =========================

const todaySales =
    document.getElementById("todaySales");

const todayTransactions =
    document.getElementById("todayTransactions");

const totalTransactions =
    document.getElementById("totalTransactions");

const pendingPayment =
    document.getElementById("pendingPayment");

const pendingTransactions =
    document.getElementById("pendingTransactions");

const totalWholesales =
    document.getElementById("totalWholesales");


// =========================
// TEMPORARY SALES ARRAY
// =========================

// Later this will come from your database.
let sales = [];


// =========================
// SALES SUMMARY
// =========================

function displaySalesSummary() {

    todaySales.textContent = "₱0";

    todayTransactions.textContent = "0";

    totalTransactions.textContent = "0";

    pendingPayment.textContent = "₱0";

    pendingTransactions.textContent = "0";

    totalWholesales.textContent = "0";

}


// =========================
// DISPLAY SALES
// =========================

function displaySales(salesList) {

    salesTableBody.innerHTML = "";

    totalSaleCount.textContent =
        sales.length;

    visibleSaleCount.textContent =
        salesList.length;


    // No sales
    if (salesList.length === 0) {

        emptyState.style.display = "flex";

        return;
    }


    emptyState.style.display = "none";


    salesList.forEach(sale => {

        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>
                ${sale.saleId}
            </td>

            <td>
                ${sale.date}
            </td>

            <td>
                ${sale.customer}
            </td>

            <td>
                ${sale.items}
            </td>

            <td>
                ₱${Number(sale.total).toLocaleString()}
            </td>

            <td>
                ${createPaymentBadge(sale.payment)}
            </td>

            <td>
                ${createStatusBadge(sale.status)}
            </td>

            <td>
                ${createActions(sale.saleId)}
            </td>
        `;


        salesTableBody.appendChild(row);

    });

}


// =========================
// STATUS BADGE
// =========================

function createStatusBadge(status) {

    if (status === "completed") {

        return `
            <span class="status-badge status-completed">
                Completed
            </span>
        `;

    }


    if (status === "pending") {

        return `
            <span class="status-badge status-pending">
                Pending
            </span>
        `;

    }


    return `
        <span class="status-badge status-cancelled">
            Cancelled
        </span>
    `;

}


// =========================
// PAYMENT BADGE
// =========================

function createPaymentBadge(payment) {

    if (payment === "paid") {

        return `
            <span class="payment-badge payment-paid">
                Paid
            </span>
        `;

    }


    if (payment === "partial") {

        return `
            <span class="payment-badge payment-partial">
                Partial
            </span>
        `;

    }


    return `
        <span class="payment-badge payment-unpaid">
            Unpaid
        </span>
    `;

}


// =========================
// ACTION BUTTONS
// =========================

function createActions(saleId) {

    return `
        <div class="sale-actions">

            <button
                class="action-btn"
                type="button"
                title="View"
                data-id="${saleId}"
            >

                <svg viewBox="0 0 24 24">
                    <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>

            </button>


            <button
                class="action-btn"
                type="button"
                title="Edit"
                data-id="${saleId}"
            >

                <svg viewBox="0 0 24 24">
                    <path d="M4 20h4L19 9l-4-4L4 16v4z"></path>
                    <path d="M13 7l4 4"></path>
                </svg>

            </button>


            <button
                class="action-btn delete"
                type="button"
                title="Delete"
                data-id="${saleId}"
            >

                <svg viewBox="0 0 24 24">
                    <path d="M4 7h16"></path>
                    <path d="M9 7V4h6v3"></path>
                    <path d="M7 7l1 13h8l1-13"></path>
                    <path d="M10 11v5"></path>
                    <path d="M14 11v5"></path>
                </svg>

            </button>

        </div>
    `;

}


// =========================
// FILTER SALES
// =========================

function filterSales() {

    const search =
        salesSearch.value.toLowerCase().trim();

    const status =
        statusFilter.value;

    const payment =
        paymentFilter.value;

    const selectedDate =
        dateFilter.value;


    const filteredSales =
        sales.filter(sale => {

            const saleId =
                String(sale.saleId || "").toLowerCase();

            const customer =
                String(sale.customer || "").toLowerCase();


            const matchesSearch =
                saleId.includes(search) ||
                customer.includes(search);


            const matchesStatus =
                status === "" ||
                sale.status === status;


            const matchesPayment =
                payment === "" ||
                sale.payment === payment;


            const matchesDate =
                selectedDate === "" ||
                sale.date === selectedDate;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesPayment &&
                matchesDate
            );

        });


    displaySales(filteredSales);

}


// =========================
// EVENTS
// =========================

salesSearch.addEventListener(
    "input",
    filterSales
);

statusFilter.addEventListener(
    "change",
    filterSales
);

paymentFilter.addEventListener(
    "change",
    filterSales
);

dateFilter.addEventListener(
    "change",
    filterSales
);


// =========================
// INITIAL DISPLAY
// =========================

displaySalesSummary();

displaySales(sales);