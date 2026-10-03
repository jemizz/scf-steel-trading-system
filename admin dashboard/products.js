(function () {
    "use strict";

    // =========================
    // SETTINGS
    // =========================

    const byId = id => document.getElementById(id);
    const tableBody = byId("productsTableBody");

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

    let apiUrl = null;

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
        if (!hasValue(value)) return "Not set";

        const amount = Number(value);

        if (!Number.isFinite(amount)) return "Not set";

        return amount.toLocaleString("en-PH", {
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

    function catalogSlug(value) {
        const category = slug(value);

        return category === "hardware-materials"
            ? "hardware-items"
            : category;
    }

    // =========================
    // INPUT RULES (NEW)
    // =========================
    // Requirements:
    // - Weight/Kilos: no special characters -> numeric only (allow decimals)
    // - Color: no numbers/special -> letters only (allow spaces and hyphen)
    // - Gauge: no letters -> numeric only (allow decimals)
    // - Brand: no special characters -> letters/numbers/spaces/hyphen only
    // - Grade: removed -> if a grade field exists in DB/API, we do not show or submit it

    function sanitizeNumericString(value) {
        // digits + single dot
        return String(value ?? "")
            .replace(/[^0-9.]/g, "")
            .replace(/(\..*)\./g, "$1");
    }

    function sanitizeLettersOnlyString(value) {
        // letters + spaces + hyphen only
        return String(value ?? "").replace(/[^a-zA-Z\s-]/g, "");
    }

    function sanitizeBrandString(value) {
        // letters + numbers + spaces + hyphen only
        return String(value ?? "").replace(/[^a-zA-Z0-9\s-]/g, "");
    }

    function attachVariantInputGuards(root) {
        if (!root) return;

        const kilos = root.querySelector('input[name="kilos"]');
        if (kilos && kilos.dataset.guard !== "1") {
            kilos.dataset.guard = "1";
            kilos.setAttribute("inputmode", "decimal");
            kilos.setAttribute("autocomplete", "off");
            kilos.addEventListener("input", () => {
                kilos.value = sanitizeNumericString(kilos.value);
            });
            kilos.addEventListener("paste", () => {
                setTimeout(() => {
                    kilos.value = sanitizeNumericString(kilos.value);
                }, 0);
            });
        }

        const gauge = root.querySelector('input[name="gauge"]');
        if (gauge && gauge.dataset.guard !== "1") {
            gauge.dataset.guard = "1";
            gauge.setAttribute("inputmode", "decimal");
            gauge.setAttribute("autocomplete", "off");
            gauge.addEventListener("input", () => {
                gauge.value = sanitizeNumericString(gauge.value);
            });
            gauge.addEventListener("paste", () => {
                setTimeout(() => {
                    gauge.value = sanitizeNumericString(gauge.value);
                }, 0);
            });
        }

        const color = root.querySelector('input[name="color"]');
        if (color && color.dataset.guard !== "1") {
            color.dataset.guard = "1";
            color.setAttribute("autocomplete", "off");
            color.addEventListener("input", () => {
                color.value = sanitizeLettersOnlyString(color.value);
            });
            color.addEventListener("paste", () => {
                setTimeout(() => {
                    color.value = sanitizeLettersOnlyString(color.value);
                }, 0);
            });
        }

        const brand = root.querySelector('input[name="brand"]');
        if (brand && brand.dataset.guard !== "1") {
            brand.dataset.guard = "1";
            brand.setAttribute("autocomplete", "off");
            brand.addEventListener("input", () => {
                brand.value = sanitizeBrandString(brand.value);
            });
            brand.addEventListener("paste", () => {
                setTimeout(() => {
                    brand.value = sanitizeBrandString(brand.value);
                }, 0);
            });
        }

        // Remove Grade field if it ever appears in the form
        const gradeInput = root.querySelector('[name="grade"], #grade');
        if (gradeInput) {
            const wrapper =
                gradeInput.closest("label") ||
                gradeInput.closest(".form-group") ||
                gradeInput.closest("div") ||
                gradeInput.parentElement;

            if (wrapper) wrapper.remove();
        }
    }

    // categories.image_path stores only the file name
    // (e.g. "flat-bar.jpg"). The file is read from the
    // uploads/products folder, next to the API folder.
    const PRODUCT_IMAGE_FOLDER = "../uploads/products/";

    // Uploaded images keep the same file name, so the browser
    // must be told to reload them after a change.
    let imageVersion = Date.now();

    function imagePath(path) {
        if (!path) return "";

        path = String(path).trim();

        // Full URLs are used as they are.
        if (/^(https?:)?\/\//.test(path)) {
            return path;
        }

        // Older records saved as "uploads/products/file.jpg".
        const fileName = path.split("/").pop();

        return new URL(
            PRODUCT_IMAGE_FOLDER + encodeURIComponent(fileName),
            new URL(apiUrl, window.location.href)
        ).href + "?v=" + imageVersion;
    }

    function productCode(product) {
        const id = Number(product.product_id);

        if (!Number.isInteger(id) || id < 1) {
            return "Not assigned";
        }

        return "P-" + String(id).padStart(4, "0");
    }

    function groupKey(product) {
        return product.group_key;
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
        return `
            <button
                type="button"
                class="action-btn ${action === "delete" ? "delete" : ""}"
                data-action="${action}"
                data-id="${Number(id)}"
                title="${escape(label)}"
                aria-label="${escape(label)}"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    ${icons[action]}
                </svg>
            </button>
        `;
    }


    // =========================
    // CREATE MODALS
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
                        <img id="detailImage" alt="">

                        <div>
                            <h3 id="detailName"></h3>
                            <p id="detailCategory"></p>

                            <span
                                id="detailCount"
                                class="scf-count"
                            ></span>

                            <div class="scf-image-actions">
                                <button
                                    type="button"
                                    id="changeImageBtn"
                                    class="scf-secondary scf-image-btn"
                                    hidden
                                >
                                    Change Image
                                </button>

                                <input
                                    type="file"
                                    id="imageInput"
                                    accept="image/png,image/jpeg,image/webp"
                                    hidden
                                >
                            </div>
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
                            placeholder="Search item, dimensions, color or record ID..."
                            aria-label="Search specifications"
                        >

                        <select
                            id="variantColor"
                            aria-label="Filter by color"
                        >
                            <option value="">All Colors</option>
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

                            <span id="variantPage">1</span>

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
                        id="addVariantBtn"
                        class="scf-primary"
                        hidden
                    >
                        + Add Variant
                    </button>

                    <button
                        type="button"
                        class="scf-secondary"
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
                            aria-label="Close variant form"
                        >
                            ×
                        </button>
                    </header>

                    <div class="scf-dialog-body">
                        <p id="editRecordLabel"></p>

                        <p id="variantFormHint" hidden>
                            Enter at least one specification.
                            Price and unit are required.
                        </p>

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
    // VARIANT FIELDS
    // =========================

    // NOTE: Grade removed. If your older code had ["grade","Grade",..],
    // keep it removed. This .filter also ensures it's never shown.
    const fields = [
        ["dimensions", "Dimensions", 80],
        ["size", "Size", 80],
        ["thickness", "Thickness", 30],
        ["kilos", "Weight / Kilos", 30],
        ["gauge", "Gauge", 20],
        ["color", "Color", 30],
        ["variant", "Variant / Type", 60],
        ["brand", "Brand", 60],
        ["price_unit", "Unit", 20],
        ["price", "Price"],
        ["price_half", "Half Price"],
        ["price_quarter", "Quarter Price"],
        ["price_per_ft", "Price per Foot"]
    ].filter(([key]) => key !== "grade");

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
    // API RESPONSE
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

        if (!response.ok || !data || !data.ok) {
            throw new Error(
                data?.error || "Request failed."
            );
        }

        return data;
    }

    function validateProductList(data) {
        if (
            !Array.isArray(data.products) ||
            data.products.some(product => (
                !Array.isArray(product.variants) ||
                typeof product.group_key !== "string" ||
                !Object.prototype.hasOwnProperty.call(
                    product,
                    "product_id"
                )
            ))
        ) {
            throw new Error(
                "Install the updated products.php file together with products.js."
            );
        }
    }


    // =========================
    // LOAD PRODUCTS
    // =========================

    async function loadProducts() {
        let data;

        try {
            if (apiUrl) {
                const response = await fetch(
                    apiUrl + "?grouped=1",
                    { cache: "no-store" }
                );

                data = await readResponse(response);

            } else {
                let lastError = null;

                for (const path of API_PATHS) {
                    try {
                        const response = await fetch(
                            path + "?grouped=1",
                            { cache: "no-store" }
                        );

                        const candidate = await readResponse(response);

                        validateProductList(candidate);

                        apiUrl = path;
                        data = candidate;

                        break;

                    } catch (error) {
                        lastError = error;
                    }
                }

                if (!apiUrl) {
                    throw lastError || new Error(
                        "Could not locate the products API."
                    );
                }
            }

            validateProductList(data);

            // Sort by the stored Product ID, not by variant record ID.
            products = data.products.sort((first, second) => {
                const firstId =
                    Number(first.product_id) || Number.MAX_SAFE_INTEGER;

                const secondId =
                    Number(second.product_id) || Number.MAX_SAFE_INTEGER;

                return firstId - secondId ||
                    first.name.localeCompare(second.name);
            });

            filterProducts(false);

            return true;

        } catch (error) {
            products = [];

            filterProducts(false);

            const empty = byId("productsEmptyState");

            empty.querySelector("h3").textContent =
                "Could not load products";

            empty.querySelector("p").textContent =
                error.message;

            return false;
        }
    }


    // =========================
    // SEARCH AND FILTER
    // =========================

    function searchable(product) {
        return [
            productCode(product),
            product.name,
            product.catalog,
            product.catalog_label,
            product.category,

            ...product.variants.flatMap(variant => [
                variant.id,
                variant.name,
                variant.spec,
                ...fields.map(([key]) => variant[key])
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

        const category = byId("categoryFilter").value;

        filteredProducts = products.filter(product => {
            const matchesSearch =
                !query || searchable(product).includes(query);

            const matchesCategory =
                !category ||
                catalogSlug(product.catalog) === category;

            return matchesSearch && matchesCategory;
        });

        if (reset) {
            page = 1;
        }

        renderProducts();
    }


    // =========================
    // MAIN PRODUCT TABLE
    // =========================

    function renderProducts() {
        const totalPages = Math.max(
            1,
            Math.ceil(filteredProducts.length / PAGE_SIZE)
        );

        page = Math.max(1, Math.min(page, totalPages));

        const visible = filteredProducts.slice(
            (page - 1) * PAGE_SIZE,
            page * PAGE_SIZE
        );

        tableBody.innerHTML = visible.map(product => `
            <tr>
                <td>
                    ${escape(productCode(product))}
                </td>

                <td>
                    <div class="product-info">
                        <div class="product-image">
                            ${
                                product.image
                                    ? `
                                        <img
                                            src="${escape(imagePath(product.image))}"
                                            alt=""
                                        >
                                    `
                                    : ""
                            }
                        </div>

                        <div class="product-details">
                            <strong>
                                ${escape(product.name)}
                            </strong>
                        </div>
                    </div>
                </td>

                <td>
                    ${escape(product.catalog)}
                </td>

                <td>
                    ${product.variants.length}
                    ${product.variants.length === 1 ? "variant" : "variants"}
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
                            "Manage variants for " + product.name
                        )}

                        ${actionButton(
                            "delete",
                            product.id,
                            "Deactivate all variants of " + product.name
                        )}
                    </div>
                </td>
            </tr>
        `).join("");

        byId("visibleProductCount").textContent = visible.length;
        byId("totalProductCount").textContent = filteredProducts.length;
        byId("currentPage").textContent = page;

        byId("previousPage").disabled = page <= 1;
        byId("nextPage").disabled = page >= totalPages;

        const empty = byId("productsEmptyState");

        empty.style.display = visible.length ? "none" : "flex";

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
        if (!selected) return;

        byId("productDetailsTitle").textContent =
            manage ? "Manage Specifications" : "Product Details";

        byId("addVariantBtn").hidden = !manage;
        byId("changeImageBtn").hidden = !manage;

        byId("detailName").textContent = selected.name;

        byId("detailCategory").textContent =
            `${productCode(selected)} · ${selected.catalog}`;

        byId("detailCount").textContent =
            selected.variants.length +
            (selected.variants.length === 1 ? " variant" : " variants");

        byId("detailDescription").textContent =
            selected.description || "";

        const image = byId("detailImage");

        image.hidden = !selected.image;
        image.alt = selected.name;

        if (selected.image) {
            image.src = imagePath(selected.image);
        } else {
            image.removeAttribute("src");
        }

        const currentColor = byId("variantColor").value;

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
            colors.includes(currentColor) ? currentColor : "";

        byId("variantColor").hidden = !colors.length;

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
    // VARIANT TABLE
    // =========================

    function renderVariants() {
        if (!selected) return;

        const query = byId("variantSearch")
            .value
            .trim()
            .toLowerCase();

        const color = byId("variantColor").value;

        const variants = selected.variants.filter(variant => {
            const matchesColor =
                !color || variant.color === color;

            const searchText = [
                variant.id,
                variant.name,
                variant.spec,
                ...fields.map(([key]) => variant[key])
            ]
                .join(" ")
                .toLowerCase();

            return matchesColor &&
                (!query || searchText.includes(query));
        });

        const pageCount = Math.max(
            1,
            Math.ceil(variants.length / VARIANT_PAGE_SIZE)
        );

        variantPage = Math.max(
            1,
            Math.min(variantPage, pageCount)
        );

        const visible = variants.slice(
            (variantPage - 1) * VARIANT_PAGE_SIZE,
            variantPage * VARIANT_PAGE_SIZE
        );

        const columns = fields.filter(([key]) => {
            return (
                key === "price" ||
                key === "price_unit" ||
                selected.variants.some(
                    variant => hasValue(variant[key])
                )
            );
        });

        // Show original item names for mixed product groups,
        // such as Welding glass and Steel brush.
        const showItemName = selected.variants.some(
            variant => variant.name !== selected.name
        );

        if (showItemName) {
            columns.unshift(["name", "Product / Item"]);
        }

        // No Notes column is added.

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
                const value = isPrice(key)
                    ? money(variant[key])
                    : (
                        hasValue(variant[key])
                            ? variant[key]
                            : "Not set"
                    );

                return `<td>${escape(value)}</td>`;
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

        const columnCount = columns.length + (manage ? 2 : 1);

        byId("variantBody").innerHTML = rows || `
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

        byId("variantPrevious").disabled = variantPage <= 1;
        byId("variantNext").disabled = variantPage >= pageCount;
    }


    // =========================
    // REFRESH SELECTED GROUP
    // =========================

    async function refreshSelected() {
        if (!selected) return;

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
        if (!apiUrl) {
            throw new Error(
                "The products API is not loaded. Refresh the page."
            );
        }

        const response = await fetch(
            apiUrl + "?action=" + encodeURIComponent(action),
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
    // ADD / EDIT VARIANT FORM
    // =========================

    function openEditor(variant = null) {
        editingId = variant ? Number(variant.id) : null;

        const adding = editingId === null;
        const values = variant || { price_unit: "pc" };

        byId("variantEditTitle").textContent =
            adding ? "Add Variant" : "Edit Specification";

        byId("saveVariant").textContent =
            adding ? "Add Variant" : "Save Changes";

        byId("variantFormHint").hidden = !adding;

        byId("editRecordLabel").textContent =
            adding
                ? `${selected.name} — New Variant`
                : `${variant.name} — Record ${editingId}`;

        byId("editError").textContent = "";

        const itemNameField = adding
            ? `
                <label>
                    Product / Item Name *

                    <input
                        type="text"
                        name="item_name"
                        maxlength="200"
                        value="${escape(selected.name)}"
                        required
                    >
                </label>
            `
            : "";

        byId("variantFields").innerHTML =
            itemNameField +
            fields.map(([key, label, max]) => {
                const required =
                    adding &&
                    (key === "price" || key === "price_unit");

                // CUSTOM ATTRIBUTES PER FIELD (NEW)
                // We keep most fields as text, but enforce your restrictions via input guards.
                // Price fields remain numeric.
                let attributes = "";

                if (isPrice(key)) {
                    attributes = `
                        type="number"
                        min="0"
                        max="99999999.99"
                        step="0.01"
                    `;
                } else if (key === "kilos" || key === "gauge") {
                    // numeric only (no special chars / no letters)
                    attributes = `
                        type="text"
                        inputmode="decimal"
                        maxlength="${max}"
                        autocomplete="off"
                    `;
                } else if (key === "color") {
                    // letters only (no numbers / no special)
                    attributes = `
                        type="text"
                        maxlength="${max}"
                        autocomplete="off"
                    `;
                } else if (key === "brand") {
                    // no special characters
                    attributes = `
                        type="text"
                        maxlength="${max}"
                        autocomplete="off"
                    `;
                } else {
                    attributes = `
                        type="text"
                        maxlength="${max}"
                    `;
                }

                return `
                    <label>
                        ${escape(label)}${required ? " *" : ""}

                        <input
                            name="${key}"
                            value="${escape(values[key])}"
                            ${attributes}
                            ${required ? "required" : ""}
                        >
                    </label>
                `;
            }).join("");

        // Attach "won't accept ..." guards after fields are created (NEW)
        attachVariantInputGuards(byId("variantFields"));

        editor.showModal();
    }


    // =========================
    // CHANGE PRODUCT IMAGE
    // =========================

    byId("changeImageBtn").addEventListener("click", () => {
        if (busy || !manage || !selected) return;

        byId("imageInput").click();
    });

    byId("imageInput").addEventListener("change", async () => {
        const input = byId("imageInput");
        const file = input.files[0];

        // Allow choosing the same file again later.
        input.value = "";

        if (!file || busy || !manage || !selected) return;

        const error = byId("detailError");
        const button = byId("changeImageBtn");

        error.textContent = "";

        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
            error.textContent = "Image must be PNG, JPG, or WebP.";
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            error.textContent = "Image must be 2 MB or smaller.";
            return;
        }

        busy = true;
        button.disabled = true;
        button.textContent = "Uploading...";

        try {
            const formData = new FormData();

            formData.append("id", String(selected.id));
            formData.append("image", file);

            const response = await fetch(
                apiUrl + "?action=update-image",
                {
                    method: "POST",
                    body: formData
                }
            );

            await readResponse(response);
            imageVersion = Date.now();
            await refreshSelected();

        } catch (uploadError) {
            console.error("Image upload failed:", uploadError);
            error.textContent = uploadError.message;
            alert("Image upload failed: " + uploadError.message);

        } finally {
            busy = false;
            button.disabled = false;
            button.textContent = "Change Image";
        }
    });


    // =========================
    // ADD VARIANT BUTTON
    // =========================

    byId("addVariantBtn").addEventListener("click", () => {
        if (busy || !manage || !selected) return;

        openEditor();
    });


    // =========================
    // MAIN TABLE ACTIONS
    // =========================

    tableBody.addEventListener("click", async event => {
        const button = event.target.closest("[data-action]");

        if (!button || busy) return;

        const product = products.find(
            item => Number(item.id) === Number(button.dataset.id)
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
            `Deactivate "${product.name}" and ALL ${product.variants.length} records in this group?\n\n` +
            "They will be hidden from active lists. Existing records will be retained."
        );

        if (!confirmed) return;

        busy = true;
        button.disabled = true;

        try {
            await postAction("deactivate-group", {
                id: product.id,
                name: product.name,
                category_id: product.category_id
            });

            const loaded = await loadProducts();

            if (!loaded) {
                alert(
                    "The group was deactivated, but the list could not refresh. Reload the page."
                );
            }

        } catch (error) {
            alert(error.message);

        } finally {
            busy = false;
            button.disabled = false;
        }
    });


    // =========================
    // VARIANT TABLE ACTIONS
    // =========================

    byId("variantBody").addEventListener("click", async event => {
        const button = event.target.closest("[data-action]");

        if (!button || busy || !manage || !selected) return;

        const variant = selected.variants.find(
            item => Number(item.id) === Number(button.dataset.id)
        );

        if (!variant) return;

        const action = button.dataset.action;

        if (action === "edit") {
            openEditor(variant);
            return;
        }

        if (action !== "delete") return;

        const confirmed = confirm(
            `Deactivate ONLY record ${variant.id} of ${variant.name}?\n` +
            `${variant.spec || ""}\n\n` +
            "Other records in this group will remain active."
        );

        if (!confirmed) return;

        busy = true;
        button.disabled = true;

        byId("detailError").textContent = "";

        try {
            const response = await fetch(
                apiUrl + "?id=" + encodeURIComponent(variant.id),
                { method: "DELETE" }
            );

            await readResponse(response);
            await refreshSelected();

        } catch (error) {
            byId("detailError").textContent = error.message;

        } finally {
            busy = false;
            button.disabled = false;
        }
    });


    // =========================
    // SAVE VARIANT
    // =========================

    byId("variantEditForm").addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            if (busy || !selected) return;

            const adding = editingId === null;

            busy = true;

            byId("saveVariant").disabled = true;
            byId("editError").textContent = "";

            try {
                const values = Object.fromEntries(
                    new FormData(event.currentTarget)
                );

                // Apply sanitizing before validation + submit (NEW)
                // Grade removed: if it exists somehow, ignore it.
                delete values.grade;

                if (Object.prototype.hasOwnProperty.call(values, "kilos")) {
                    values.kilos = sanitizeNumericString(values.kilos);
                }

                if (Object.prototype.hasOwnProperty.call(values, "gauge")) {
                    values.gauge = sanitizeNumericString(values.gauge);
                }

                if (Object.prototype.hasOwnProperty.call(values, "color")) {
                    values.color = sanitizeLettersOnlyString(values.color);
                }

                if (Object.prototype.hasOwnProperty.call(values, "brand")) {
                    values.brand = sanitizeBrandString(values.brand);
                }

                if (adding) {
                    if (!String(values.item_name || "").trim()) {
                        throw new Error(
                            "Product / Item Name is required."
                        );
                    }

                    const hasSpecification = fields.some(([key]) => {
                        return (
                            key !== "price_unit" &&
                            !isPrice(key) &&
                            String(values[key] || "").trim() !== ""
                        );
                    });

                    if (!hasSpecification) {
                        throw new Error(
                            "Enter at least one specification, such as dimensions, size or type."
                        );
                    }

                    if (
                        String(values.price ?? "").trim() === "" ||
                        String(values.price_unit ?? "").trim() === ""
                    ) {
                        throw new Error(
                            "Price and unit are required."
                        );
                    }
                }

                await postAction(
                    adding ? "add-variant" : "update-variant",
                    {
                        ...values,
                        id: adding ? selected.id : editingId,
                        name: selected.name,
                        category_id: selected.category_id
                    }
                );

                if (adding) {
                    byId("variantSearch").value = "";
                    byId("variantColor").value = "";

                    // Show the final page containing the newly added record.
                    variantPage = Number.MAX_SAFE_INTEGER;
                }

                editor.close();

                await refreshSelected();

            } catch (error) {
                byId("editError").textContent = error.message;

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

        dialog.addEventListener("close", updateDialogScroll);
    });


    // =========================
    // BACKGROUND SCROLL
    // =========================

    function updateDialogScroll() {
        document.body.classList.toggle(
            "scf-dialog-open",
            details.open || editor.open
        );
    }

    const dialogObserver = new MutationObserver(
        updateDialogScroll
    );

    [details, editor].forEach(dialog => {
        dialogObserver.observe(dialog, {
            attributes: true,
            attributeFilter: ["open"]
        });
    });


    // =========================
    // MISSING IMAGES
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

    byId("variantSearch").addEventListener("input", () => {
        variantPage = 1;
        renderVariants();
    });

    byId("variantColor").addEventListener("change", () => {
        variantPage = 1;
        renderVariants();
    });


    // =========================
    // PRODUCT PAGINATION
    // =========================

    byId("previousPage").addEventListener("click", () => {
        if (page > 1) {
            page--;
            renderProducts();
        }
    });

    byId("nextPage").addEventListener("click", () => {
        const totalPages = Math.max(
            1,
            Math.ceil(filteredProducts.length / PAGE_SIZE)
        );

        if (page < totalPages) {
            page++;
            renderProducts();
        }
    });


    // =========================
    // VARIANT PAGINATION
    // =========================

    byId("variantPrevious").addEventListener("click", () => {
        if (variantPage > 1) {
            variantPage--;
            renderVariants();
        }
    });

    byId("variantNext").addEventListener("click", () => {
        variantPage++;
        renderVariants();
    });


    // =========================
    // DATE AND TIME
    // =========================

    function updateDateTime() {
        const now = new Date();

        const dateElement = byId("currentDate");
        const timeElement = byId("currentTime");

        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString(
                "en-US",
                {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                }
            );
        }

        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString(
                "en-US",
                {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                }
            );
        }
    }

    updateDateTime();

    setInterval(updateDateTime, 1000);


    // =========================
    // EXTERNAL REFRESH
    // =========================

    window.reloadProducts = loadProducts;


    // =========================
    // INITIAL LOAD
    // =========================

    loadProducts();

})();