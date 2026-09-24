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
// PRODUCT ELEMENTS
// =========================

const productsTableBody =
    document.getElementById("productsTableBody");

const emptyState =
    document.getElementById("productsEmptyState");

const totalProductCount =
    document.getElementById("totalProductCount");

const visibleProductCount =
    document.getElementById("visibleProductCount");

const productSearch =
    document.getElementById("productSearch");

const categoryFilter =
    document.getElementById("categoryFilter");

const statusFilter =
    document.getElementById("statusFilter");


// =========================
// TEMPORARY PRODUCT ARRAY
// =========================

// Later this will come from your database.
let products = [];


// =========================
// DISPLAY PRODUCTS
// =========================

function displayProducts(productList) {

    productsTableBody.innerHTML = "";

    totalProductCount.textContent =
        products.length;

    visibleProductCount.textContent =
        productList.length;


    // No products
    if (productList.length === 0) {

        emptyState.style.display = "flex";

        return;
    }


    emptyState.style.display = "none";


    productList.forEach(product => {

        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>${product.productId}</td>

            <td>
                <div class="product-info">

                    <div class="product-image">
                        ${
                            product.image
                                ? `<img src="${product.image}" alt="${product.name}">`
                                : ""
                        }
                    </div>

                    <div class="product-details">

                        <strong>
                            ${product.name}
                        </strong>

                        <span>
                            ${product.variant || ""}
                        </span>

                    </div>

                </div>
            </td>

            <td>
                ${product.category}
            </td>

            <td>
                ₱${Number(product.price).toLocaleString()}
            </td>

            <td>

                <span class="stock-value">
                    ${product.stock}
                </span>

                <span class="stock-minimum">
                    Min: ${product.minimumStock}
                </span>

            </td>

            <td>
                ${product.unit}
            </td>

            <td>
                ${createStatusBadge(product.status)}
            </td>

            <td>
                ${createActions(product.productId)}
            </td>
        `;


        productsTableBody.appendChild(row);

    });

}


// =========================
// STATUS BADGE
// =========================

function createStatusBadge(status) {

    if (status === "in-stock") {

        return `
            <span class="status-badge status-in-stock">
                In Stock
            </span>
        `;

    }


    if (status === "low-stock") {

        return `
            <span class="status-badge status-low-stock">
                Low Stock
            </span>
        `;

    }


    return `
        <span class="status-badge status-out-of-stock">
            Out of Stock
        </span>
    `;

}


// =========================
// ACTION BUTTONS
// =========================

function createActions(productId) {

    return `
        <div class="product-actions">

            <button
                class="action-btn"
                type="button"
                title="View"
                data-id="${productId}"
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
                data-id="${productId}"
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
                data-id="${productId}"
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
// FILTER PRODUCTS
// =========================

function filterProducts() {

    const search =
        productSearch.value.toLowerCase().trim();

    const category =
        categoryFilter.value;

    const status =
        statusFilter.value;


    const filteredProducts =
        products.filter(product => {

            const matchesSearch =
                product.name.toLowerCase().includes(search) ||
                product.productId.toLowerCase().includes(search) ||
                product.category.toLowerCase().includes(search);


            const matchesCategory =
                category === "" ||
                product.category === category;


            const matchesStatus =
                status === "" ||
                product.status === status;


            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );

        });


    displayProducts(filteredProducts);

}


// =========================
// EVENTS
// =========================

productSearch.addEventListener(
    "input",
    filterProducts
);

categoryFilter.addEventListener(
    "change",
    filterProducts
);

statusFilter.addEventListener(
    "change",
    filterProducts
);


// =========================
// INITIAL DISPLAY
// =========================

displayProducts(products);