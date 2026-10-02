(function () {
'use strict';

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

    const dateEl = document.getElementById("currentDate");
    const timeEl = document.getElementById("currentTime");

    if (dateEl) dateEl.textContent = date;
    if (timeEl) timeEl.textContent = time;
}

updateDateTime();
setInterval(updateDateTime, 1000);


// =========================
// SETTINGS (palitan kung kailangan)
// =========================
const API_CANDIDATES = [
    "api/products.php",
    "products.php",
    "../api/products.php",
    "/api/products.php"
];
let API_URL = API_CANDIDATES[0];
const IMAGE_BASE = "images/";        // folder ng mga larawan (flat-bar.jpg -> images/flat-bar.jpg)
const PAGE_SIZE = 10;


// =========================
// PRODUCT ELEMENTS
// =========================
const productsTableBody = document.getElementById("productsTableBody");
const emptyState = document.getElementById("productsEmptyState");
const totalProductCount = document.getElementById("totalProductCount");
const visibleProductCount = document.getElementById("visibleProductCount");
const productSearch = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const previousPageBtn = document.getElementById("previousPage");
const nextPageBtn = document.getElementById("nextPage");
const currentPageEl = document.getElementById("currentPage");


// =========================
// STATE
// =========================
let products = [];
let filteredProducts = [];
let currentPage = 1;


// =========================
// HELPERS
// =========================
function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function imageUrl(path) {
    if (!path) return "";
    if (path.includes("/")) return path;   // hal. uploads/products/...
    return IMAGE_BASE + path;              // hal. flat-bar.jpg
}


// =========================
// LOAD PRODUCTS FROM DATABASE
// =========================
async function fetchProductsJson() {
    const errors = [];

    for (const url of API_CANDIDATES) {
        try {
            const response = await fetch(url);
            const text = await response.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                errors.push(`${url} -> HTTP ${response.status}, hindi JSON: ${text.slice(0, 120).replace(/\s+/g, " ")}`);
                continue;
            }

            if (!data.ok) {
                errors.push(`${url} -> ${data.error || "ok=false"}`);
                continue;
            }

            API_URL = url;
            window.PRODUCTS_API_URL = new URL(url, document.baseURI).href;
            return data;
        } catch (e) {
            errors.push(`${url} -> ${e.message}`);
        }
    }

    throw new Error(errors.join("\n"));
}

function showLoadError(message) {
    const title = emptyState.querySelector("h3");
    const text = emptyState.querySelector("p");

    if (title) title.textContent = "Could not load products";
    if (text) {
        text.style.whiteSpace = "pre-wrap";
        text.style.maxWidth = "600px";
        text.textContent = message;
    }
}

async function loadProducts(goLast = false) {
    try {
        const data = await fetchProductsJson();

        products = data.products.map(p => ({
            id: p.id,
            productId: "P-" + String(p.id).padStart(4, "0"),
            name: p.name,
            variant: p.spec || "",
            category: p.catalog || "",
            subcategory: p.category || "",
            price: p.price ?? 0,
            unit: p.price_unit || "pc",
            image: p.image,
            // Walang stock table sa database, kaya pansamantalang In Stock lahat.
            status: "in-stock"
        }));

        products.sort((a, b) => a.id - b.id);

        filterProducts();

        if (goLast) {
            currentPage = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
            displayProducts();
        }

    } catch (error) {
        console.error("Products load error:", error);
        products = [];
        filteredProducts = [];
        displayProducts();
        showLoadError(error.message);
    }
}


// =========================
// DISPLAY PRODUCTS
// =========================
function displayProducts() {
    productsTableBody.innerHTML = "";

    const total = filteredProducts.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filteredProducts.slice(start, start + PAGE_SIZE);

    totalProductCount.textContent = products.length;
    visibleProductCount.textContent = pageItems.length;

    if (currentPageEl) currentPageEl.textContent = currentPage;
    if (previousPageBtn) previousPageBtn.disabled = currentPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;

    if (pageItems.length === 0) {
        emptyState.style.display = "flex";
        return;
    }

    emptyState.style.display = "none";

    pageItems.forEach(product => {
        const row = document.createElement("tr");
        const img = imageUrl(product.image);

        row.innerHTML = `
            <td>${escapeHtml(product.productId)}</td>

            <td>
                <div class="product-info">
                    <div class="product-image">
                        ${
                            img
                                ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(product.name)}" onerror="this.remove()">`
                                : ""
                        }
                    </div>

                    <div class="product-details">
                        <strong>${escapeHtml(product.name)}</strong>
                        <span>${escapeHtml(product.variant)}</span>
                    </div>
                </div>
            </td>

            <td>${escapeHtml(product.category)}</td>

            <td>₱${Number(product.price).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}</td>

            <td>${escapeHtml(product.unit)}</td>

            <td>${createStatusBadge(product.status)}</td>

            <td>${createActions(product.id)}</td>
        `;

        productsTableBody.appendChild(row);
    });
}


// =========================
// STATUS BADGE
// =========================
function createStatusBadge(status) {
    if (status === "in-stock") {
        return `<span class="status-badge status-in-stock">In Stock</span>`;
    }

    if (status === "low-stock") {
        return `<span class="status-badge status-low-stock">Low Stock</span>`;
    }

    return `<span class="status-badge status-out-of-stock">Out of Stock</span>`;
}


// =========================
// ACTION BUTTONS
// =========================
function createActions(id) {
    return `
        <div class="product-actions">
            <button class="action-btn" type="button" title="View" data-action="view" data-id="${id}">
                <svg viewBox="0 0 24 24">
                    <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            </button>

            <button class="action-btn" type="button" title="Edit" data-action="edit" data-id="${id}">
                <svg viewBox="0 0 24 24">
                    <path d="M4 20h4L19 9l-4-4L4 16v4z"></path>
                    <path d="M13 7l4 4"></path>
                </svg>
            </button>

            <button class="action-btn delete" type="button" title="Delete" data-action="delete" data-id="${id}">
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
// FILTER PRODUCTS
// =========================
function filterProducts() {
    const search = productSearch ? productSearch.value.toLowerCase().trim() : "";
    const category = categoryFilter ? categoryFilter.value : "";
    const status = statusFilter ? statusFilter.value : "";

    filteredProducts = products.filter(product => {
        const matchesSearch =
            search === "" ||
            product.name.toLowerCase().includes(search) ||
            product.productId.toLowerCase().includes(search) ||
            product.category.toLowerCase().includes(search) ||
            product.subcategory.toLowerCase().includes(search) ||
            product.variant.toLowerCase().includes(search);

        const matchesCategory =
            category === "" ||
            slugify(product.category) === category;

        const matchesStatus =
            status === "" ||
            product.status === status;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    currentPage = 1;
    displayProducts();
}


// =========================
// DELETE PRODUCT (soft delete via API)
// =========================
async function deleteProduct(id) {
    if (!confirm("Deactivate this product?")) return;

    try {
        const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
            method: "DELETE"
        });
        const data = await response.json();

        if (!data.ok) throw new Error(data.error || "Delete failed");

        products = products.filter(p => p.id !== id);
        filterProducts();

    } catch (error) {
        console.error("Delete error:", error);
        alert("Could not delete the product.");
    }
}


// =========================
// EVENTS
// =========================
if (productSearch) productSearch.addEventListener("input", filterProducts);
if (categoryFilter) categoryFilter.addEventListener("change", filterProducts);
if (statusFilter) statusFilter.addEventListener("change", filterProducts);

if (previousPageBtn) {
    previousPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            displayProducts();
        }
    });
}

if (nextPageBtn) {
    nextPageBtn.addEventListener("click", () => {
        currentPage++;
        displayProducts();
    });
}

if (productsTableBody) {
    productsTableBody.addEventListener("click", event => {
        const btn = event.target.closest(".action-btn");
        if (!btn) return;

        const id = Number(btn.dataset.id);

        if (btn.dataset.action === "delete") {
            deleteProduct(id);
        }
        // view / edit: idagdag dito kapag handa na ang modal
    });
}


// =========================
// INITIAL LOAD
// =========================
console.log("products.js loaded");

if (productsTableBody) {
    loadProducts();
} else {
    console.error("productsTableBody not found");
}

// Para ma-refresh ng ibang script (hal. add-product.js) ang table
window.reloadProducts = goLast => loadProducts(!!goLast);

})();