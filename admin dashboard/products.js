(function () {
    "use strict";

    // =========================
    // SETTINGS
    // =========================

    const tableBody =
        document.getElementById("productsTableBody");

    if (!tableBody) return;

    const PAGE_SIZE = 10;
    const VARIANT_PAGE_SIZE = 5;

    const API_PATHS = [
        "api/products.php",
        "products.php",
        "../api/products.php",
        "/api/products.php"
    ];

    // =========================
    // STATE
    // =========================

    let apiUrl;

    let products = [];
    let filteredProducts = [];

    let page = 1;
    let selected = null;
    let variantPage = 1;

    let manage = false;
    let busy = false;
    let editingId = null;

    // =========================
    // HELPERS
    // =========================

    const byId = id => document.getElementById(id);

    function escape(value) {
        return String(value ?? "").replace(
            /[&<>"']/g,
            character => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[character]
        );
    }

    function hasValue(value) {
        return (
            value !== null &&
            value !== undefined &&
            value !== ""
        );
    }

    function money(value) {
        if (!hasValue(value)) {
            return "Not set";
        }

        return Number(value).toLocaleString("en-PH", {
            style: "currency",
            currency: "PHP"
        });
    }

    function slug(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    }

    function imagePath(path) {
        if (!path) return "";

        return path.includes("/")
            ? path
            : "images/" + path;
    }

    function groupKey(product) {
        return JSON.stringify([
            Number(product.category_id),
            product.name
        ]);
    }

    function formatProductId(id) {
        return "P-" + String(id).padStart(4, "0");
    }

    // =========================
    // ACTION ICONS
    // =========================

    const icons = {
        view: `
            <path
                d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12"
            ></path>
            <circle cx="12" cy="12" r="3"></circle>
        `,

        edit: `
            <path
                d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4"
            ></path>
        `,

        delete: `
            <path
                d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"
            ></path>
        `
    };

    function actionButton(action, id, label) {
        const deleteClass =
            action === "delete" ? "delete" : "";

        return `
            <button
                type="button"
                class="action-btn ${deleteClass}"
                data-action="${action}"
                data-id="${Number(id)}"
                title="${escape(label)}"
                aria-label="${escape(label)}"
            >
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    ${icons[action]}
                </svg>
            </button>
        `;
    }

    // =========================
    // CREATE PRODUCT MODALS
    // =========================

    document.body.insertAdjacentHTML(
        "beforeend",
        `
            <dialog
                id="productDetailsDialog"
                class="scf-product-dialog"
                aria-labelledby="productDetailsTitle"
            >
                <header class="scf-dialog-header">
                    <h2 id="productDetailsTitle">
                        Product Details
                    </h2>

                    <button
                        type="button"
                        class="scf-close"
                        data-close="productDetailsDialog"
                        aria-label="Close product details"
                    >
                        ×
                    </button>
                </header>

                <div class="scf-dialog-body">
                    <div class="scf-product-summary">
                        <img
                            id="detailImage"
                            alt=""
                        >

                        <div>
                            <h3 id="detailName"></h3>

                            <p id="detailCategory"></p>

                            <span
                                id="detailCount"
                                class="scf-count"
                            ></span>
                        </div>
                    </div>

                    <p
                        id="detailDescription"
                        class="scf-description"
                    ></p>

                    <h3 class="scf-section-title">
                        Specifications &amp; Sizes
                    </h3>

                    <div class="scf-variant-tools">
                        <input
                            type="search"
                            id="variantSearch"
                            placeholder="Search dimensions, color or record ID..."
                            aria-label="Search specifications"
                        >

                        <select
                            id="variantColor"
                            aria-label="Filter by color"
                        >
                            <option value="">
                                All Colors
                            </option>
                        </select>
                    </div>

                    <p
                        id="detailError"
                        class="scf-error"
                        role="alert"
                    ></p>

                    <div class="scf-variant-scroll">
                        <table class="scf-variant-table">
                            <thead id="variantHead"></thead>
                            <tbody id="variantBody"></tbody>
                        </table>
                    </div>

                    <div class="scf-variant-footer">
                        <p
                            id="variantCount"
                            aria-live="polite"
                        ></p>

                        <div class="pagination">
                            <button
                                type="button"
                                id="variantPrevious"
                                aria-label="Previous variants page"
                            >
                                ‹
                            </button>

                            <span id="variantPage">
                                1
                            </span>

                            <button
                                type="button"
                                id="variantNext"
                                aria-label="Next variants page"
                            >
                                ›
                            </button>
                        </div>
                    </div>
                </div>

                <footer class="scf-dialog-footer">
                    <button
                        type="button"
                        class="scf-primary"
                        data-close="productDetailsDialog"
                    >
                        Close
                    </button>
                </footer>
            </dialog>

            <dialog
                id="variantEditDialog"
                class="scf-product-dialog scf-edit-dialog"
                aria-labelledby="variantEditTitle"
            >
                <form id="variantEditForm">
                    <header class="scf-dialog-header">
                        <h2 id="variantEditTitle">
                            Edit Specification
                        </h2>

                        <button
                            type="button"
                            class="scf-close"
                            data-close="variantEditDialog"
                            aria-label="Close editor"
                        >
                            ×
                        </button>
                    </header>

                    <div class="scf-dialog-body">
                        <p id="editRecordLabel"></p>

                        <div
                            id="variantFields"
                            class="scf-edit-grid"
                        ></div>

                        <p
                            id="editError"
                            class="scf-error"
                            role="alert"
                        ></p>
                    </div>

                    <footer class="scf-dialog-footer">
                        <button
                            type="button"
                            class="scf-secondary"
                            data-close="variantEditDialog"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="scf-primary"
                            id="saveVariant"
                        >
                            Save Changes
                        </button>
                    </footer>
                </form>
            </dialog>
        `
    );

    const details = byId("productDetailsDialog");
    const editor = byId("variantEditDialog");

    // =========================
    // SPECIFICATION FIELDS
    // =========================

    const fields = [
        ["dimensions", "Dimensions", 80],
        ["size", "Size", 80],
        ["thickness", "Thickness", 30],
        ["kilos", "Weight / Kilos", 30],
        ["gauge", "Gauge", 20],
        ["color", "Color", 30],
        ["grade", "Grade", 20],
        ["variant", "Variant / Type", 60],
        ["brand", "Brand", 60],
        ["price_unit", "Unit", 20],
        ["price", "Price"],
        ["price_half", "Half Price"],
        ["price_quarter", "Quarter Price"],
        ["price_per_ft", "Price per Foot"]
    ];

    function isPrice(key) {
        return (
            key === "price" ||
            (
                key.startsWith("price_") &&
                key !== "price_unit"
            )
        );
    }

    // =========================
    // READ API RESPONSE
    // =========================

    async function readResponse(response) {
        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                "The server did not return JSON. Check the PHP API path and Apache."
            );
        }

        if (!response.ok || !data.ok) {
            throw new Error(
                data.error || "Request failed."
            );
        }

        return data;
    }

    // =========================
    // LOAD GROUPED PRODUCTS
    // =========================

    async function loadProducts() {
        let data;

        try {
            if (apiUrl) {
                const response = await fetch(
                    apiUrl + "?grouped=1",
                    {
                        cache: "no-store"
                    }
                );

                data = await readResponse(response);
            } else {
                for (const path of API_PATHS) {
                    try {
                        const response = await fetch(
                            path + "?grouped=1",
                            {
                                cache: "no-store"
                            }
                        );

                        data = await readResponse(response);

                        if (!Array.isArray(data.products)) {
                            throw new Error(
                                "Missing products list."
                            );
                        }

                        apiUrl = path;
                        break;
                    } catch (error) {
                        const lastPath =
                            API_PATHS[API_PATHS.length - 1];

                        if (path === lastPath) {
                            throw error;
                        }
                    }
                }
            }

            if (
                !Array.isArray(data.products) ||
                data.products.some(
                    product => !Array.isArray(product.variants)
                )
            ) {
                throw new Error(
                    "Please install the updated products.php file."
                );
            }

            products = data.products;

            filterProducts(false);

            return true;
        } catch (error) {
            products = [];

            filterProducts(false);

            const empty =
                byId("productsEmptyState");

            empty.querySelector("h3").textContent =
                "Could not load products";

            empty.querySelector("p").textContent =
                error.message;

            return false;
        }
    }

    // =========================
    // SEARCH AND CATEGORY FILTER
    // =========================

    function searchable(product) {
        return [
            formatProductId(product.id),
            product.name,
            product.catalog,
            product.category,

            ...product.variants.flatMap(variant => [
                variant.id,
                variant.spec,

                ...fields.map(
                    ([key]) => variant[key]
                )
            ])
        ]
            .join(" ")
            .toLowerCase();
    }

    function filterProducts(reset = true) {
        const query = byId("productSearch")
            .value
            .trim()
            .toLowerCase();

        const category =
            byId("categoryFilter").value;

        filteredProducts = products.filter(product => {
            const matchesSearch =
                !query ||
                searchable(product).includes(query);

            const matchesCategory =
                !category ||
                slug(product.catalog) === category;

            return matchesSearch && matchesCategory;
        });

        if (reset) {
            page = 1;
        }

        renderProducts();
    }

    // =========================
    // DISPLAY MAIN PRODUCTS TABLE
    // =========================

    function renderProducts() {
        const totalPages = Math.max(
            1,
            Math.ceil(
                filteredProducts.length / PAGE_SIZE
            )
        );

        page = Math.min(page, totalPages);

        const visible = filteredProducts.slice(
            (page - 1) * PAGE_SIZE,
            page * PAGE_SIZE
        );

        tableBody.innerHTML = visible.map(product => {
            const image = product.image
                ? `
                    <img
                        src="${escape(imagePath(product.image))}"
                        alt=""
                    >
                `
                : "";

            return `
                <tr>
                    <td>
                        ${escape(formatProductId(product.id))}
                    </td>

                    <td>
                        <div class="product-info">
                            <div class="product-image">
                                ${image}
                            </div>

                            <div class="product-details">
                                <strong>
                                    ${escape(product.name)}
                                </strong>

                                <span>
                                    ${escape(product.category)}
                                </span>
                            </div>
                        </div>
                    </td>

                    <td>
                        ${escape(product.catalog)}
                    </td>

                    <td>
                        ${product.variants.length} variants
                    </td>

                    <td>
                        <div class="product-actions">
                            ${actionButton(
                                "view",
                                product.id,
                                "View " + product.name
                            )}

                            ${actionButton(
                                "edit",
                                product.id,
                                "Edit specifications for " + product.name
                            )}

                            ${actionButton(
                                "delete",
                                product.id,
                                "Deactivate all variants of " + product.name
                            )}
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        byId("visibleProductCount").textContent =
            visible.length;

        byId("totalProductCount").textContent =
            filteredProducts.length;

        byId("currentPage").textContent = page;

        byId("previousPage").disabled =
            page <= 1;

        byId("nextPage").disabled =
            page >= totalPages;

        const empty =
            byId("productsEmptyState");

        empty.style.display =
            visible.length ? "none" : "flex";

        empty.querySelector("h3").textContent =
            products.length
                ? "No matching products"
                : "No products yet";

        empty.querySelector("p").textContent =
            products.length
                ? "Try another search or category."
                : "Products added to the system will appear here.";
    }

    // =========================
    // PRODUCT DETAILS
    // =========================

    function populateDetails() {
        byId("productDetailsTitle").textContent =
            manage
                ? "Manage Specifications"
                : "Product Details";

        byId("detailName").textContent =
            selected.name;

        byId("detailCategory").textContent =
            selected.catalog;

        byId("detailCount").textContent =
            selected.variants.length + " variants";

        byId("detailDescription").textContent =
            selected.description || "";

        const image = byId("detailImage");

        image.hidden = !selected.image;
        image.alt = selected.name;

        if (selected.image) {
            image.src = imagePath(selected.image);
        }

        const currentColor =
            byId("variantColor").value;

        const colors = [
            ...new Set(
                selected.variants
                    .map(variant => variant.color)
                    .filter(hasValue)
            )
        ].sort();

        byId("variantColor").innerHTML =
            '<option value="">All Colors</option>' +
            colors.map(color => `
                <option value="${escape(color)}">
                    ${escape(color)}
                </option>
            `).join("");

        byId("variantColor").value =
            colors.includes(currentColor)
                ? currentColor
                : "";

        byId("variantColor").hidden =
            !colors.length;

        renderVariants();
    }

    function openDetails(product, editing) {
        selected = product;
        manage = editing;
        variantPage = 1;

        byId("variantSearch").value = "";
        byId("variantColor").value = "";
        byId("detailError").textContent = "";

        populateDetails();

        details.showModal();
    }

    // =========================
    // DISPLAY VARIANTS TABLE
    // =========================

    function renderVariants() {
        const query = byId("variantSearch")
            .value
            .toLowerCase()
            .trim();

        const color =
            byId("variantColor").value;

        const variants = selected.variants.filter(variant => {
            const matchesColor =
                !color ||
                variant.color === color;

            const searchText = [
                variant.id,
                variant.spec,

                ...fields.map(
                    ([key]) => variant[key]
                ),

                variant.notes
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !query ||
                searchText.includes(query);

            return matchesColor && matchesSearch;
        });

        const pageCount = Math.max(
            1,
            Math.ceil(
                variants.length / VARIANT_PAGE_SIZE
            )
        );

        variantPage = Math.min(
            variantPage,
            pageCount
        );

        const visible = variants.slice(
            (variantPage - 1) * VARIANT_PAGE_SIZE,
            variantPage * VARIANT_PAGE_SIZE
        );

        // Show fields used by this product.
        // Keep the columns stable while searching.
        const columns = fields.filter(([key]) => {
            return (
                key === "price" ||
                key === "price_unit" ||
                selected.variants.some(
                    variant => hasValue(variant[key])
                )
            );
        });

        const hasNotes = selected.variants.some(
            variant => hasValue(variant.notes)
        );

        if (hasNotes) {
            columns.push(["notes", "Notes"]);
        }

        byId("variantHead").innerHTML = `
            <tr>
                <th>Record ID</th>

                ${columns.map(([, label]) => `
                    <th>${escape(label)}</th>
                `).join("")}

                ${manage ? "<th>Actions</th>" : ""}
            </tr>
        `;

        const rows = visible.map(variant => {
            const cells = columns.map(([key]) => {
                let value;

                if (isPrice(key)) {
                    value = money(variant[key]);
                } else {
                    value = hasValue(variant[key])
                        ? variant[key]
                        : "Not set";
                }

                return `
                    <td>${escape(value)}</td>
                `;
            }).join("");

            const actions = manage
                ? `
                    <td>
                        <div class="product-actions">
                            ${actionButton(
                                "edit",
                                variant.id,
                                "Edit record " + variant.id
                            )}

                            ${actionButton(
                                "delete",
                                variant.id,
                                "Deactivate record " + variant.id
                            )}
                        </div>
                    </td>
                `
                : "";

            return `
                <tr>
                    <td>${Number(variant.id)}</td>
                    ${cells}
                    ${actions}
                </tr>
            `;
        }).join("");

        const columnCount =
            columns.length + (manage ? 2 : 1);

        byId("variantBody").innerHTML =
            rows ||
            `
                <tr>
                    <td colspan="${columnCount}">
                        No matching specifications.
                    </td>
                </tr>
            `;

        byId("variantCount").textContent =
            `Showing ${visible.length} of ${variants.length} variants`;

        byId("variantPage").textContent =
            `${variantPage} / ${pageCount}`;

        byId("variantPrevious").disabled =
            variantPage <= 1;

        byId("variantNext").disabled =
            variantPage >= pageCount;
    }

    // =========================
    // REFRESH OPEN PRODUCT
    // =========================

    async function refreshSelected() {
        const key = groupKey(selected);

        const loaded = await loadProducts();

        if (!loaded) {
            details.close();

            alert(
                "The change was saved, but the list could not refresh. Reload the page."
            );

            return;
        }

        selected = products.find(
            product => groupKey(product) === key
        );

        if (selected) {
            populateDetails();
        } else {
            details.close();
        }
    }

    // =========================
    // POST API ACTION
    // =========================

    async function postAction(action, payload) {
        const response = await fetch(
            apiUrl + "?action=" + action,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(payload)
            }
        );

        return readResponse(response);
    }

    // =========================
    // OPEN VARIANT EDITOR
    // =========================

    function openEditor(variant) {
        editingId = Number(variant.id);

        byId("editRecordLabel").textContent =
            `${selected.name} — Record ${editingId}`;

        byId("editError").textContent = "";

        byId("variantFields").innerHTML =
            fields.map(([key, label, max]) => {
                const attributes = isPrice(key)
                    ? `
                        type="number"
                        min="0"
                        max="99999999.99"
                        step="0.01"
                    `
                    : `
                        type="text"
                        maxlength="${max}"
                    `;

                return `
                    <label>
                        ${escape(label)}

                        <input
                            name="${key}"
                            value="${escape(variant[key])}"
                            ${attributes}
                        >
                    </label>
                `;
            }).join("");

        editor.showModal();
    }

    // =========================
    // MAIN TABLE ACTIONS
    // =========================

    tableBody.addEventListener(
        "click",
        async event => {
            const button =
                event.target.closest("[data-action]");

            if (!button || busy) return;

            const product = products.find(
                item =>
                    Number(item.id) ===
                    Number(button.dataset.id)
            );

            if (!product) return;

            const action = button.dataset.action;

            if (action === "view") {
                openDetails(product, false);
                return;
            }

            if (action === "edit") {
                openDetails(product, true);
                return;
            }

            if (action !== "delete") return;

            const confirmed = confirm(
                `Deactivate "${product.name}" and ALL ${product.variants.length} specifications?\n\n` +
                "They will be hidden from active lists. Existing records will be retained."
            );

            if (!confirmed) return;

            busy = true;
            button.disabled = true;

            try {
                await postAction(
                    "deactivate-group",
                    {
                        id: product.id,
                        name: product.name,
                        category_id: product.category_id
                    }
                );

                await loadProducts();
            } catch (error) {
                alert(error.message);
            } finally {
                busy = false;
                button.disabled = false;
            }
        }
    );

    // =========================
    // VARIANT TABLE ACTIONS
    // =========================

    byId("variantBody").addEventListener(
        "click",
        async event => {
            const button =
                event.target.closest("[data-action]");

            if (!button || busy || !manage) return;

            const variant = selected.variants.find(
                item =>
                    Number(item.id) ===
                    Number(button.dataset.id)
            );

            if (!variant) return;

            const action = button.dataset.action;

            if (action === "edit") {
                openEditor(variant);
                return;
            }

            if (action !== "delete") return;

            const confirmed = confirm(
                `Deactivate ONLY record ${variant.id} of ${selected.name}?\n` +
                `${variant.spec || ""}\n\n` +
                "Other specifications will remain active."
            );

            if (!confirmed) return;

            busy = true;
            button.disabled = true;

            byId("detailError").textContent = "";

            try {
                const response = await fetch(
                    apiUrl +
                    "?id=" +
                    encodeURIComponent(variant.id),
                    {
                        method: "DELETE"
                    }
                );

                await readResponse(response);
                await refreshSelected();
            } catch (error) {
                byId("detailError").textContent =
                    error.message;
            } finally {
                busy = false;
                button.disabled = false;
            }
        }
    );

    // =========================
    // SAVE VARIANT CHANGES
    // =========================

    byId("variantEditForm").addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            if (busy) return;

            busy = true;

            byId("saveVariant").disabled = true;
            byId("editError").textContent = "";

            try {
                const values = Object.fromEntries(
                    new FormData(event.currentTarget)
                );

                await postAction(
                    "update-variant",
                    {
                        ...values,
                        id: editingId
                    }
                );

                editor.close();

                await refreshSelected();
            } catch (error) {
                byId("editError").textContent =
                    error.message;
            } finally {
                busy = false;
                byId("saveVariant").disabled = false;
            }
        }
    );

    // =========================
    // MODAL CLOSE BUTTONS
    // =========================

    [details, editor].forEach(dialog => {
        dialog.querySelectorAll("[data-close]").forEach(button => {
            button.addEventListener("click", () => {
                if (!busy) {
                    byId(button.dataset.close).close();
                }
            });
        });

        dialog.addEventListener("cancel", event => {
            if (busy) {
                event.preventDefault();
            }
        });

        dialog.addEventListener("close", () => {
            document.body.classList.toggle(
                "scf-dialog-open",
                details.open || editor.open
            );
        });
    });

    // =========================
    // PREVENT BACKGROUND SCROLL
    // =========================

    const dialogObserver = new MutationObserver(() => {
        document.body.classList.toggle(
            "scf-dialog-open",
            details.open || editor.open
        );
    });

    dialogObserver.observe(details, {
        attributes: true,
        attributeFilter: ["open"]
    });

    dialogObserver.observe(editor, {
        attributes: true,
        attributeFilter: ["open"]
    });

    // =========================
    // HANDLE MISSING IMAGES
    // =========================

    document.addEventListener(
        "error",
        event => {
            const image = event.target;

            if (
                image.tagName === "IMG" &&
                (
                    tableBody.contains(image) ||
                    details.contains(image)
                )
            ) {
                image.hidden = true;
            }
        },
        true
    );

    // =========================
    // SEARCH AND FILTER EVENTS
    // =========================

    byId("productSearch").addEventListener(
        "input",
        () => filterProducts()
    );

    byId("categoryFilter").addEventListener(
        "change",
        () => filterProducts()
    );

    byId("variantSearch").addEventListener(
        "input",
        () => {
            variantPage = 1;
            renderVariants();
        }
    );

    byId("variantColor").addEventListener(
        "change",
        () => {
            variantPage = 1;
            renderVariants();
        }
    );

    // =========================
    // MAIN TABLE PAGINATION
    // =========================

    byId("previousPage").addEventListener(
        "click",
        () => {
            if (page > 1) {
                page--;
                renderProducts();
            }
        }
    );

    byId("nextPage").addEventListener(
        "click",
        () => {
            page++;
            renderProducts();
        }
    );

    // =========================
    // VARIANT PAGINATION
    // =========================

    byId("variantPrevious").addEventListener(
        "click",
        () => {
            if (variantPage > 1) {
                variantPage--;
                renderVariants();
            }
        }
    );

    byId("variantNext").addEventListener(
        "click",
        () => {
            variantPage++;
            renderVariants();
        }
    );

    // =========================
    // DATE AND TIME
    // =========================

    function updateDateTime() {
        const now = new Date();

        const dateElement =
            byId("currentDate");

        const timeElement =
            byId("currentTime");

        if (dateElement) {
            dateElement.textContent =
                now.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                });
        }

        if (timeElement) {
            timeElement.textContent =
                now.toLocaleTimeString("en-US", {
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
    // EXTERNAL REFRESH
    // Used by add-product.js
    // =========================

    window.reloadProducts = loadProducts;

    // =========================
    // INITIAL LOAD
    // =========================

    loadProducts();
})();