(() => {
    const basePath = new URL(".", document.currentScript.src);

    let modal;
    let loading;
    let imageURL;
    let previousOverflow = "";
    let previousButton;
    let saving = false;

    const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // tugma sa products.php (2 MB)

    // Hinahanap ang tamang products.php (kapareho ng products.js),
    // para hindi HTML 404 page ang matanggap kapag iba ang folder.
    let resolvedApi;

    async function apiUrl() {
        if (resolvedApi) return resolvedApi;

        const candidates = [
            window.PRODUCTS_API_URL,
            new URL("api/products.php", basePath).href,
            new URL("products.php", basePath).href,
            new URL("../api/products.php", basePath).href,
            new URL("api/products.php", document.baseURI).href,
            new URL("products.php", document.baseURI).href,
            new URL("../api/products.php", document.baseURI).href,
            new URL("/api/products.php", document.baseURI).href
        ].filter(Boolean);

        for (const url of new Set(candidates)) {
            try {
                const response = await fetch(url, { cache: "no-store" });
                const data = JSON.parse(await response.text());

                if (data && data.ok && Array.isArray(data.categories)) {
                    resolvedApi = url;
                    return url;
                }
            } catch (error) {
                // subukan ang susunod na path
            }
        }

        throw new Error(
            "Could not find products.php. Set window.PRODUCTS_API_URL or check the API folder."
        );
    }

    // =========================
    // CONNECT EXISTING BUTTONS
    // =========================

    document.addEventListener("click", function (event) {
        const button = event.target.closest(
            "#quickAddProduct, #addProductBtn"
        );

        if (!button) return;

        event.preventDefault();

        if (typeof closeTopbarMenus === "function") {
            closeTopbarMenus();
        }

        openModal(button);
    });

    // =========================
    // LOAD MODAL
    // =========================

    async function loadModal() {
        const stylesheet = document.createElement("link");

        stylesheet.rel = "stylesheet";
        stylesheet.href = new URL("add-product.css", basePath);

        document.head.appendChild(stylesheet);

        const response = await fetch(
            new URL("add-product.html", basePath),
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("Could not load add-product.html.");
        }

        const html = await response.text();

        document.body.insertAdjacentHTML("beforeend", html);

        modal = document.getElementById("addProductModal");

        // Remove the old browser-storage notice.
        modal.querySelector(".ap-notice")?.remove();

        modal.querySelectorAll("[data-ap-close]").forEach(button => {
            button.addEventListener("click", closeModal);
        });

        modal.addEventListener("cancel", function (event) {
            event.preventDefault();
            closeModal();
        });

        modal.addEventListener("close", function () {
            document.body.style.overflow = previousOverflow;
            previousButton?.focus();
        });

        modal.querySelector("#apAddVariant").addEventListener(
            "click",
            function () {
                addVariant();
            }
        );

        modal.querySelector("#apImage").addEventListener(
            "change",
            previewImage
        );

        modal.querySelector("#apRemoveImage").addEventListener(
            "click",
            clearImage
        );

        modal.querySelector("#apForm").addEventListener(
            "submit",
            saveProduct
        );
    }

    // =========================
    // CATEGORIES (from database)
    // =========================

    async function loadCategories() {
        // Gumagana kahit luma pa ang add-product.html (name="category")
        const select =
            modal.querySelector("#apCategory") ||
            modal.querySelector('select[name="category_id"], select[name="category"]');

        if (!select) {
            throw new Error("Category dropdown not found in add-product.html.");
        }

        select.id = "apCategory";
        select.name = "category_id";

        const response = await fetch(await apiUrl(), { cache: "no-store" });
        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || "Could not load categories.");
        }

        // Main categories lang (walang subcategory)
        const parents = (data.categories || []).filter(c => !c.parent_id);

        select.replaceChildren(new Option("Select a category", ""));

        parents.forEach(parent => {
            select.appendChild(new Option(parent.name, parent.id));
        });
    }

    // =========================
    // SAVE TO DATABASE
    // =========================

    async function saveProduct(event) {
        event.preventDefault();

        if (saving) return;

        const form = modal.querySelector("#apForm");
        const saveButton = modal.querySelector("#apSave");

        const name = form.elements["name"].value.trim();
        const categoryId = form.elements["category_id"].value;
        const description = form.elements["description"].value.trim();
        const showInCatalog = form.elements["showInCatalog"].checked;
        const imageFile = modal.querySelector("#apImage").files[0];

        const variants = [...modal.querySelectorAll("#apVariants tr")].map(row => ({
            sku: row.children[0].querySelector("input").value.trim(),
            spec: row.children[1].querySelector("input").value.trim(),
            unit: row.children[2].querySelector("select").value,
            price: row.children[3].querySelector("input").value,
            min_stock: row.children[4].querySelector("input").value
        }));

        if (!name || !categoryId) {
            showError("Product name and category are required.");
            return;
        }

        if (variants.length === 0 ||
            variants.some(v => !v.spec || v.price === "")) {
            showError("Each variant needs a specification and a price.");
            return;
        }

        const formData = new FormData();

        formData.append("name", name);
        formData.append("category_id", categoryId);
        formData.append("description", description);
        formData.append("variants", JSON.stringify(variants));

        if (showInCatalog) formData.append("showInCatalog", "1");
        if (imageFile) formData.append("image", imageFile);

        saving = true;
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
        showError("");

        try {
            const response = await fetch(await apiUrl(), {
                method: "POST",
                body: formData
            });

            const text = await response.text();
            let data;

            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(
                    "Server error: " + text.slice(0, 150).replace(/\s+/g, " ")
                );
            }

            if (!data.ok) {
                throw new Error(data.error || "Could not save the product.");
            }

            closeModal();
            showToast(data.message || "Product saved.");

            if (typeof window.reloadProducts === "function") {
                window.reloadProducts(true);
            }

        } catch (error) {
            showError(error.message);
        } finally {
            saving = false;
            saveButton.disabled = false;
            saveButton.textContent = "Save Product";
        }
    }

    function showToast(message) {
        const toast = document.createElement("div");

        toast.className = "ap-toast";
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3500);
    }

    // =========================
    // OPEN AND CLOSE
    // =========================

    async function openModal(button) {
        try {
            if (!modal) {
                if (!loading) {
                    loading = loadModal().catch(error => {
                        loading = null;
                        throw error;
                    });
                }

                await loading;
            }

            if (modal.open) return;

            await loadCategories();

            modal.querySelector("#apForm").reset();
            modal.querySelector("#apVariants").replaceChildren();

            clearImage();
            showError("");
            addVariant();

            previousButton = button;
            previousOverflow = document.body.style.overflow;

            document.body.style.overflow = "hidden";

            modal.showModal();

            modal.querySelector('[name="name"]').focus();

        } catch (error) {
            alert(error.message);
        }
    }

    function closeModal() {
        modal.close();
    }

    // =========================
    // VARIANT ROWS
    // =========================

    function addVariant() {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <input
                    type="text"
                    aria-label="SKU"
                    placeholder="Optional"
                >
            </td>

            <td>
                <input
                    type="text"
                    aria-label="Specifications"
                    placeholder="Size, thickness, length..."
                    required
                >
            </td>

            <td>
                <select aria-label="Unit">
                    <option>pc</option>
                    <option>sheet</option>
                    <option>meter</option>
                    <option>kg</option>
                    <option>box</option>
                    <option>set</option>
                    <option>roll</option>
                </select>
            </td>

            <td>
                <input
                    type="number"
                    aria-label="Price"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                >
            </td>

            <td>
                <input
                    type="number"
                    aria-label="Minimum stock"
                    min="0"
                    step="1"
                    value="0"
                    required
                >
            </td>

            <td>
                <button
                    type="button"
                    class="ap-remove"
                    aria-label="Remove variant"
                >
                    ×
                </button>
            </td>
        `;

        row.querySelector(".ap-remove").addEventListener(
            "click",
            function () {
                row.remove();
                updateVariantCount();
            }
        );

        modal.querySelector("#apVariants").appendChild(row);

        updateVariantCount();

        if (modal.open) {
            row.querySelector("input").focus();
        }
    }

    function updateVariantCount() {
        const rows = modal.querySelectorAll("#apVariants tr");

        modal.querySelector("#apVariantCount").textContent =
            rows.length + (rows.length === 1 ? " variant" : " variants");

        rows.forEach(row => {
            row.querySelector(".ap-remove").disabled =
                rows.length === 1;
        });
    }

    // =========================
    // IMAGE PREVIEW
    // =========================

    function previewImage(event) {
        const file = event.target.files[0];

        if (!file) return;

        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/webp"
        ];

        if (
            !allowedTypes.includes(file.type) ||
            file.size > MAX_IMAGE_SIZE
        ) {
            event.target.value = "";

            showError(
                "Choose a PNG, JPG or WebP image up to 2 MB."
            );

            return;
        }

        if (imageURL) {
            URL.revokeObjectURL(imageURL);
        }

        imageURL = URL.createObjectURL(file);

        const preview = modal.querySelector("#apImagePreview");

        preview.src = imageURL;
        preview.hidden = false;

        modal.querySelector("#apRemoveImage").hidden = false;

        showError("");
    }

    function clearImage() {
        if (imageURL) {
            URL.revokeObjectURL(imageURL);
            imageURL = null;
        }

        const preview = modal.querySelector("#apImagePreview");

        preview.removeAttribute("src");
        preview.hidden = true;

        modal.querySelector("#apImage").value = "";
        modal.querySelector("#apRemoveImage").hidden = true;
    }

    function showError(message) {
        const error = modal.querySelector("#apError");

        error.textContent = message;
        error.hidden = !message;
    }
})();