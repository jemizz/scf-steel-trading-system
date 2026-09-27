(() => {
    const basePath = new URL(".", document.currentScript.src);

    let modal;
    let loading;
    let imageURL;
    let previousOverflow = "";
    let previousButton;

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
            new URL("add-product.html", basePath)
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
            function (event) {
                event.preventDefault();

                alert(
                    "Front-end preview only. Saving will be connected later."
                );
            }
        );
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
                    placeholder="ST-001"
                    required
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
            file.size > 500 * 1024
        ) {
            event.target.value = "";

            showError(
                "Choose a PNG, JPG or WebP image up to 500 KB."
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