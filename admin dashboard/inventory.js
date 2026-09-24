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
// INVENTORY DATA
// =========================

// This is empty for now.
// Later, this data will come from the database.

let inventory = [];


// =========================
// ELEMENTS
// =========================

const inventoryTableBody =
    document.getElementById("inventoryTableBody");

const inventoryEmptyState =
    document.getElementById("inventoryEmptyState");

const inventorySearch =
    document.getElementById("inventorySearch");

const categoryFilter =
    document.getElementById("categoryFilter");

const statusFilter =
    document.getElementById("statusFilter");


// =========================
// STATUS
// =========================

function getStockStatus(item) {

    if (item.stock <= 0) {
        return "out-of-stock";
    }

    if (item.stock <= item.minimumStock) {
        return "low-stock";
    }

    return "in-stock";
}


function createStatusBadge(status) {

    if (status === "in-stock") {

        return `
            <span class="stock-status status-in-stock">
                In Stock
            </span>
        `;

    }


    if (status === "low-stock") {

        return `
            <span class="stock-status status-low-stock">
                Low Stock
            </span>
        `;

    }


    return `
        <span class="stock-status status-out-of-stock">
            Out of Stock
        </span>
    `;

}


// =========================
// ACTION BUTTON
// =========================

function createActions(productId) {

    return `
        <div class="inventory-actions">

            <button
                type="button"
                class="inventory-action-btn"
                title="View Inventory"
                data-id="${productId}"
            >

                <svg viewBox="0 0 24 24">
                    <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>

            </button>

        </div>
    `;

}


// =========================
// DISPLAY INVENTORY
// =========================

function displayInventory(items) {

    inventoryTableBody.innerHTML = "";


    document.getElementById("totalInventoryCount").textContent =
        inventory.length;

    document.getElementById("visibleInventoryCount").textContent =
        items.length;


    if (items.length === 0) {

        inventoryEmptyState.style.display = "flex";

    } else {

        inventoryEmptyState.style.display = "none";

    }


    items.forEach(item => {

        const status =
            getStockStatus(item);


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${item.productId}
            </td>


            <td>
                ${item.productName}
            </td>


            <td>
                ${item.category}
            </td>


            <td>
                <span class="stock-quantity">
                    ${item.stock}
                </span>
            </td>


            <td>
                ${item.unit}
            </td>


            <td>
                ${item.minimumStock}
            </td>


            <td>
                ${createStatusBadge(status)}
            </td>


            <td>
                ${createActions(item.productId)}
            </td>

        `;


        inventoryTableBody.appendChild(row);

    });


    updateSummary();

}


// =========================
// SUMMARY
// =========================

function updateSummary() {

    const total =
        inventory.length;


    const inStock =
        inventory.filter(item =>
            getStockStatus(item) === "in-stock"
        ).length;


    const lowStock =
        inventory.filter(item =>
            getStockStatus(item) === "low-stock"
        ).length;


    const outOfStock =
        inventory.filter(item =>
            getStockStatus(item) === "out-of-stock"
        ).length;


    document.getElementById("totalItems").textContent =
        total;

    document.getElementById("inStockItems").textContent =
        inStock;

    document.getElementById("lowStockItems").textContent =
        lowStock;

    document.getElementById("outOfStockItems").textContent =
        outOfStock;

}


// =========================
// FILTER
// =========================

function filterInventory() {

    const search =
        inventorySearch.value
            .toLowerCase()
            .trim();


    const category =
        categoryFilter.value;


    const status =
        statusFilter.value;


    const filtered =
        inventory.filter(item => {

            const itemStatus =
                getStockStatus(item);


            const matchesSearch =
                item.productId
                    .toLowerCase()
                    .includes(search)

                ||

                item.productName
                    .toLowerCase()
                    .includes(search)

                ||

                item.category
                    .toLowerCase()
                    .includes(search);


            const matchesCategory =
                category === "" ||
                item.category === category;


            const matchesStatus =
                status === "" ||
                itemStatus === status;


            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );

        });


    displayInventory(filtered);

}


// =========================
// EVENTS
// =========================

inventorySearch.addEventListener(
    "input",
    filterInventory
);


categoryFilter.addEventListener(
    "change",
    filterInventory
);


statusFilter.addEventListener(
    "change",
    filterInventory
);


// =========================
// INITIAL LOAD
// =========================

displayInventory(inventory);