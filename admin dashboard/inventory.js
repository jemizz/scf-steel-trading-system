// =========================
// DATE AND TIME
// Safe if topbar elements are not on this page.
// =========================

function updateDateTime() {
    const dateEl = document.getElementById("currentDate");
    const timeEl = document.getElementById("currentTime");

    if (!dateEl && !timeEl) {
        return;
    }

    const now = new Date();

    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    }
}

updateDateTime();
setInterval(updateDateTime, 1000);


// =========================
// INVENTORY DATA
// Comes from inventory.php / products table.
// =========================

let inventory = [];

const PAGE_SIZE = 10;
let currentPage = 1;


// =========================
// ELEMENTS
// =========================

const inventoryTableBody = document.getElementById("inventoryTableBody");
const inventoryEmptyState = document.getElementById("inventoryEmptyState");
const inventorySearch = document.getElementById("inventorySearch");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");


// =========================
// STATUS
// =========================

function getStockStatus(item) {
    const stock = Number(item.stock) || 0;
    const minimum = Number(item.minimumStock) || 0;

    if (stock <= 0) {
        return "out-of-stock";
    }

    if (stock < minimum) {
        return "low-stock";
    }

    if (stock <= Math.ceil(minimum * 1.5)) {
        return "under-monitor";
    }

    return "in-stock";
}


function createStatusBadge(status) {
    const labels = {
        "in-stock": ["status-in-stock", "In Stock"],
        "under-monitor": ["status-under-monitor", "Under Monitor"],
        "low-stock": ["status-low-stock", "Low Stock"],
        "out-of-stock": ["status-out-of-stock", "Out of Stock"]
    };

    const [className, label] = labels[status] || labels["out-of-stock"];

    return `<span class="stock-status ${className}">${label}</span>`;
}


function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}


function createActions(productId) {
    return `
        <div class="inventory-actions">
            <button
                type="button"
                class="inventory-action-btn"
                title="View Inventory"
                data-id="${escapeHtml(productId)}"
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
// DISPLAY
// =========================

function displayInventory(items) {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = items.slice(start, start + PAGE_SIZE);

    inventoryTableBody.innerHTML = "";

    document.getElementById("totalInventoryCount").textContent = inventory.length;
    document.getElementById("visibleInventoryCount").textContent = items.length;

    const rangeEl = document.getElementById("inventoryRange");

    if (rangeEl) {
        rangeEl.textContent = items.length === 0
            ? "0"
            : (start + 1) + "-" + Math.min(start + PAGE_SIZE, items.length);
    }

    if (items.length === 0) {
        inventoryEmptyState.style.display = "flex";
    } else {
        inventoryEmptyState.style.display = "none";
    }

    pageItems.forEach(item => {
        const row = document.createElement("tr");
        const spec = item.spec
            ? `<span class="product-spec">${escapeHtml(item.spec)}</span>`
            : "";

        row.innerHTML = `
            <td>${escapeHtml(item.productId)}</td>
            <td>
                <span class="product-name">${escapeHtml(item.productName)}</span>
                ${spec}
            </td>
            <td>${escapeHtml(item.category)}</td>
            <td><span class="stock-quantity">${escapeHtml(item.stock)}</span></td>
            <td>${escapeHtml(item.minimumStock)}</td>
            <td>${createStatusBadge(getStockStatus(item))}</td>
            <td>${createActions(item.productId)}</td>
        `;

        inventoryTableBody.appendChild(row);
    });

    const pageLabel = document.getElementById("inventoryPageLabel");
    const prevBtn = document.getElementById("inventoryPrev");
    const nextBtn = document.getElementById("inventoryNext");

    if (pageLabel) {
        pageLabel.textContent = String(currentPage);
    }

    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1 || items.length === 0;
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages || items.length === 0;
    }

    updateSummary();
}


function updateSummary() {
    const count = status => inventory.filter(item => getStockStatus(item) === status).length;

    document.getElementById("inStockItems").textContent = count("in-stock");
    document.getElementById("underMonitorItems").textContent = count("under-monitor");
    document.getElementById("lowStockItems").textContent = count("low-stock");
    document.getElementById("outOfStockItems").textContent = count("out-of-stock");

    const totalEl = document.getElementById("totalItems");

    if (totalEl) {
        totalEl.textContent = inventory.length;
    }
}


function setEmptyMessage(title, copy) {
    const heading = inventoryEmptyState.querySelector("h3");
    const text = inventoryEmptyState.querySelector("p");

    if (heading) {
        heading.textContent = title;
    }

    if (text) {
        text.textContent = copy;
    }
}


// =========================
// FILTER
// =========================

function filterInventory() {
    const search = inventorySearch.value.toLowerCase().trim();
    const category = categoryFilter.value;
    const status = statusFilter.value;

    return inventory.filter(item => {
        const haystack = [
            item.productId,
            item.dbId,
            item.productName,
            item.spec,
            item.category
        ].join(" ").toLowerCase();

        const matchesSearch = search === "" || haystack.includes(search);
        const matchesCategory = category === "" || item.category === category;
        const matchesStatus = status === "" || getStockStatus(item) === status;

        return matchesSearch && matchesCategory && matchesStatus;
    });
}


function applyFilters() {
    currentPage = 1;

    const items = filterInventory();
    const hasQuery =
        inventorySearch.value.trim() !== "" ||
        categoryFilter.value !== "" ||
        statusFilter.value !== "";

    if (items.length === 0 && hasQuery) {
        setEmptyMessage(
            "No matching inventory",
            "No records match your search or filters."
        );
    } else if (items.length === 0) {
        setEmptyMessage(
            "No inventory records yet",
            "Inventory records will appear here once products are added to the system."
        );
    }

    displayInventory(items);
}


inventorySearch.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
statusFilter.addEventListener("change", applyFilters);

document.getElementById("inventoryPrev")?.addEventListener("click", function () {
    if (currentPage > 1) {
        currentPage -= 1;
        displayInventory(filterInventory());
    }
});

document.getElementById("inventoryNext")?.addEventListener("click", function () {
    currentPage += 1;
    displayInventory(filterInventory());
});


// =========================
// LOAD FROM DATABASE
// Calls inventory.php and fills the table.
// =========================

async function loadInventory() {
    try {
        const response = await fetch("inventory.php");

        const raw = await response.text();

        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            throw new Error("Invalid server response: " + raw.slice(0, 200));
        }

        if (!data.ok) {
            throw new Error(data.error || "Unknown server error");
        }

        inventory = data.items || [];

        currentPage = 1;
        applyFilters();
    } catch (err) {
        console.error("Inventory load failed:", err);

        inventory = [];
        applyFilters();

        setEmptyMessage(
            "Failed to load inventory",
            "There was a problem loading the data. Check the console (F12) for details."
        );
    }
}

// Go!
loadInventory();