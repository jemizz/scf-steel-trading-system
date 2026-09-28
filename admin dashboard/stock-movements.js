(() => {
    "use strict";

    // =========================
    // FRONT-END DATA
    // =========================

    let inventoryItems = [];

    let movementHistory = [];

    let movementType = "IN";

    let submitting = false;

    let toastTimer;

    let elements = null;


    // =========================
    // REASONS
    // =========================

    const movementReasons = {
        IN: [
            {
                value: "OPENING",
                label: "Opening Stock"
            },
            {
                value: "CUSTOMER_RETURN",
                label: "Customer Return"
            },
            {
                value: "COUNT_INCREASE",
                label: "Stock Count Adjustment"
            }
        ],

        OUT: [
            {
                value: "DAMAGE",
                label: "Damaged Items"
            },
            {
                value: "SUPPLIER_RETURN",
                label: "Return to Supplier"
            },
            {
                value: "COUNT_DECREASE",
                label: "Stock Count Adjustment"
            }
        ]
    };


    // =========================
    // PUBLIC FUNCTIONS
    // =========================

    window.StockMovements = {
        setInventory(items) {
            if (!Array.isArray(items)) {
                throw new Error(
                    "Inventory data must be an array."
                );
            }

            const usedIds = new Set();

            items.forEach(item => {
                if (
                    typeof item.variantId !== "string" ||
                    item.variantId.trim() === ""
                ) {
                    throw new Error(
                        "Each product size needs a unique variantId."
                    );
                }

                if (usedIds.has(item.variantId)) {
                    throw new Error(
                        "Duplicate variantId: " + item.variantId
                    );
                }

                usedIds.add(item.variantId);

                const requiredTextFields = [
                    "productId",
                    "productName",
                    "dimensions",
                    "category",
                    "unit"
                ];

                requiredTextFields.forEach(field => {
                    if (
                        typeof item[field] !== "string" ||
                        item[field].trim() === ""
                    ) {
                        throw new Error(
                            item.variantId + " needs a valid " + field + "."
                        );
                    }
                });

                if (
                    !Number.isFinite(item.stock) ||
                    item.stock < 0
                ) {
                    throw new Error(
                        item.variantId + " needs a valid stock quantity."
                    );
                }

                if (
                    !Number.isFinite(item.minimumStock) ||
                    item.minimumStock < 0
                ) {
                    throw new Error(
                        item.variantId + " needs a valid minimumStock."
                    );
                }

                const step = item.quantityStep ?? 1;

                if (
                    !Number.isFinite(step) ||
                    step < 0.001
                ) {
                    throw new Error(
                        "quantityStep must be at least 0.001."
                    );
                }
            });

            // Keep the same array so your inventory page can refresh
            // using its existing data after a movement is confirmed.
            inventoryItems = items;

            if (elements && elements.modal.open) {
                populateProducts();
                populateDimensions();
            }
        },

        getInventory() {
            return inventoryItems.map(item => ({ ...item }));
        },

        getMovements() {
            return movementHistory.map(item => ({ ...item }));
        },

        openStockIn() {
            openModal("IN");
        },

        openStockOut() {
            openModal("OUT");
        }
    };


    // =========================
    // LOAD SEPARATE HTML FILE
    // =========================

    async function initializeStockMovements() {
        let container =
        document.getElementById("stockMovementContainer");

    // Create the container automatically if the current
    // page does not already have one.
    if (!container) {

        container = document.createElement("div");

        container.id = "stockMovementContainer";

        document.body.appendChild(container);

    }

        try {
            const response = await fetch(
                "stock-movements.html"
            );

            if (!response.ok) {
                throw new Error(
                    "Could not load stock-movements.html."
                );
            }

            container.innerHTML = await response.text();

            collectElements();

            attachEvents();

            setLaunchButtonsDisabled(false);

        } catch (error) {
            console.error(error);

            setLaunchButtonsDisabled(true);

            const message = document.createElement("p");

            message.textContent =
                "Stock forms could not load. Open the page using " +
                "Live Server or localhost and check that " +
                "stock-movements.html is in the same folder.";

            message.style.color = "#b23939";
            message.style.padding = "16px";

            container.replaceChildren(message);
        }
    }


    function setLaunchButtonsDisabled(disabled) {
        ["stockInBtn", "stockOutBtn"].forEach(id => {
            const button = document.getElementById(id);

            if (button) {
                button.disabled = disabled;
            }
        });
    }


    function collectElements() {
        const get = id => document.getElementById(id);

        elements = {
            modal: get("stockMovementModal"),
            form: get("stockMovementForm"),

            title: get("stockModalTitle"),
            description: get("stockModalDescription"),

            product: get("stockProduct"),
            dimension: get("stockDimension"),
            category: get("stockCategory"),
            unit: get("stockUnit"),

            quantity: get("stockQuantity"),
            quantityHelp: get("stockQuantityHelp"),

            reason: get("stockReason"),

            reference: get("stockReference"),
            referenceLabel: get("stockReferenceLabel"),

            notes: get("stockNotes"),
            notesLabel: get("stockNotesLabel"),

            currentStock: get("stockCurrentValue"),
            newStock: get("stockNewValue"),
            newStockLabel: get("stockNewValueLabel"),

            information: get("stockInformation"),
            error: get("stockErrorMessage"),

            close: get("closeStockModal"),
            cancel: get("cancelStockModal"),
            confirm: get("confirmStockMovement"),

            toast: get("stockToast")
        };
    }


    // =========================
// CONNECT STOCK BUTTONS
// Works with buttons loaded
// later through topbar.html.
// =========================

function attachEvents() {

    document.addEventListener("click", function (event) {

        if (!(event.target instanceof Element)) {
            return;
        }

        const stockInButton = event.target.closest(
            "#stockInBtn, #quickStockIn"
        );

        const stockOutButton = event.target.closest(
            "#stockOutBtn, #quickStockOut"
        );

        if (!stockInButton && !stockOutButton) {
            return;
        }

        event.preventDefault();

        // Close the Quick Access dropdown.
        if (typeof window.closeTopbarMenus === "function") {
            window.closeTopbarMenus();
        }

        // Each button opens its corresponding form.
        if (stockInButton) {
            openModal("IN");
        } else {
            openModal("OUT");
        }

    });


    // Close buttons.
    elements.close.addEventListener(
        "click",
        closeModal
    );

    elements.cancel.addEventListener(
        "click",
        closeModal
    );


    // Product and dimension selection.
    elements.product.addEventListener(
        "change",
        populateDimensions
    );

    elements.dimension.addEventListener(
        "change",
        updateSelectedVariant
    );


    // Update stock preview while typing.
    elements.quantity.addEventListener(
        "input",
        updateStockPreview
    );


    // Change required fields based on reason.
    elements.reason.addEventListener(
        "change",
        updateRequiredFields
    );


    // Confirm the form.
    elements.form.addEventListener(
        "submit",
        confirmMovement
    );


    // Close when clicking outside the floating window.
    elements.modal.addEventListener("click", function (event) {

        if (event.target !== elements.modal) {
            return;
        }

        const bounds = elements.modal.getBoundingClientRect();

        const clickedOutside =
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom;

        if (clickedOutside) {
            closeModal();
        }

    });


    // Handle Escape inside this popup without triggering
    // the topbar's Escape handlers for other modals.
    elements.modal.addEventListener("keydown", function (event) {

        if (event.key !== "Escape") {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        closeModal();

    });


    elements.modal.addEventListener("cancel", function (event) {

        if (submitting) {
            event.preventDefault();
        }

    });

}


    // =========================
    // OPEN / CLOSE
    // =========================

    function openModal(type) {
        if (
            !elements ||
            elements.modal.open ||
            submitting
        ) {
            return;
        }

        movementType = type;

        elements.form.reset();

        elements.modal.dataset.type = type;

        elements.error.textContent = "";

        const isStockIn = type === "IN";

        const title = isStockIn
            ? "Stock In"
            : "Stock Out";

        elements.title.textContent = title;

        elements.description.textContent = isStockIn
            ? "Record opening stock, returns, or stock adjustments."
            : "Record damaged items, supplier returns, or adjustments.";

        elements.quantityHelp.textContent = isStockIn
            ? "Enter the quantity to add."
            : "Quantity cannot exceed the available stock.";

        elements.newStockLabel.textContent =
            "After " + title;

        elements.confirm.textContent =
            "Confirm " + title;

        elements.information.replaceChildren();

        if (isStockIn) {
            const link = document.createElement("a");

            link.href = "purchase-orders.html";

            link.textContent = "Purchase Orders";

            elements.information.append(
                "Supplier delivery? Receive it through ",
                link,
                ". Minimum stock stays unchanged."
            );
        } else {
            elements.information.textContent =
                "Completed sales should deduct stock automatically " +
                "once the system is connected. Do not record " +
                "the same sale again here.";
        }

        populateProducts();

        populateReasons();

        populateDimensions();

        updateRequiredFields();

        if (inventoryItems.length === 0) {
            elements.error.textContent =
                "No product sizes are available yet. " +
                "Load product data before recording stock.";
        }

        elements.modal.showModal();
    }


    function closeModal() {
        if (!submitting) {
            elements.modal.close();
        }
    }


    // =========================
    // PRODUCT AND SIZE OPTIONS
    // =========================

    function populateProducts() {
        elements.product.replaceChildren(
            new Option("Select product", "")
        );

        const products = new Map();

        inventoryItems.forEach(item => {
            products.set(
                item.productId,
                item.productName
            );
        });

        products.forEach((name, id) => {
            elements.product.add(
                new Option(
                    id + " — " + name,
                    id
                )
            );
        });
    }


    function populateDimensions() {
        elements.dimension.replaceChildren(
            new Option("Select dimensions", "")
        );

        const productId = elements.product.value;

        const variants = inventoryItems.filter(item => {
            return item.productId === productId;
        });

        variants.forEach(item => {
            elements.dimension.add(
                new Option(
                    item.dimensions,
                    item.variantId
                )
            );
        });

        elements.dimension.disabled =
            variants.length === 0;

        updateSelectedVariant();
    }


    function populateReasons() {
        elements.reason.replaceChildren(
            new Option("Select reason", "")
        );

        movementReasons[movementType].forEach(reason => {
            elements.reason.add(
                new Option(
                    reason.label,
                    reason.value
                )
            );
        });
    }


    function getSelectedVariant() {
        return inventoryItems.find(item => {
            return item.variantId === elements.dimension.value;
        });
    }


    function updateSelectedVariant() {
        const item = getSelectedVariant();

        elements.category.value = item
            ? item.category
            : "";

        elements.unit.value = item
            ? item.unit
            : "";

        const quantityStep = item
            ? item.quantityStep ?? 1
            : 1;

        elements.quantity.min = quantityStep;
        elements.quantity.step = quantityStep;

        if (movementType === "OUT" && item) {
            elements.quantity.max = item.stock;
        } else {
            elements.quantity.max = 1000000000;
        }

        elements.confirm.disabled = !item;

        updateStockPreview();
    }


    // =========================
    // STOCK PREVIEW
    // =========================

    function formatQuantity(quantity, unit) {
        return quantity.toLocaleString("en-US", {
            maximumFractionDigits: 3
        }) + " " + unit;
    }


    function calculateNewStock(currentStock, quantity) {
        const result = movementType === "IN"
            ? currentStock + quantity
            : currentStock - quantity;

        return Math.round(result * 1000) / 1000;
    }


    function updateStockPreview() {
        const item = getSelectedVariant();

        elements.error.textContent = "";

        if (!item) {
            elements.currentStock.textContent = "—";

            elements.newStock.textContent = "—";

            return;
        }

        elements.currentStock.textContent =
            formatQuantity(item.stock, item.unit);

        const quantity = Number(
            elements.quantity.value
        );

        if (
            elements.quantity.value === "" ||
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {
            elements.newStock.textContent = "—";

            return;
        }

        const newStock = calculateNewStock(
            item.stock,
            quantity
        );

        elements.newStock.textContent =
            formatQuantity(newStock, item.unit);

        if (newStock < 0) {
            elements.error.textContent =
                "Quantity cannot exceed available stock.";
        }
    }


    // =========================
    // CONDITIONAL REQUIREMENTS
    // =========================

    function updateRequiredFields() {
        const reason = elements.reason.value;

        const referenceRequired = [
            "CUSTOMER_RETURN",
            "SUPPLIER_RETURN"
        ].includes(reason);

        const notesRequired = [
            "COUNT_INCREASE",
            "COUNT_DECREASE",
            "DAMAGE"
        ].includes(reason);

        elements.reference.required =
            referenceRequired;

        elements.notes.required =
            notesRequired;

        elements.referenceLabel.textContent =
            referenceRequired
                ? "(required)"
                : "(optional)";

        elements.notesLabel.textContent =
            notesRequired
                ? "(required)"
                : "(optional)";
    }


    // =========================
    // VALIDATION
    // =========================

    function validateMovement(item, quantity) {
        if (!item) {
            return "Select a product and its dimensions.";
        }

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0 ||
            quantity > 1000000000
        ) {
            return "Enter a valid quantity greater than zero.";
        }

        const step = item.quantityStep ?? 1;

        const increments = quantity / step;

        if (
            Math.abs(
                increments - Math.round(increments)
            ) > 0.000001
        ) {
            return "Quantity must use increments of " +
                step + " " + item.unit + ".";
        }

        if (
            movementType === "OUT" &&
            quantity > item.stock
        ) {
            return "You cannot remove more than " +
                formatQuantity(item.stock, item.unit) + ".";
        }

        const reason = elements.reason.value;

        const validReason =
            movementReasons[movementType].some(item => {
                return item.value === reason;
            });

        if (!validReason) {
            return "Select a valid reason.";
        }

        if (
            elements.reference.required &&
            elements.reference.value.trim() === ""
        ) {
            return "Enter the original sale or purchase reference.";
        }

        if (
            elements.notes.required &&
            elements.notes.value.trim() === ""
        ) {
            return "Add notes explaining this adjustment.";
        }

        const hasMovement = movementHistory.some(movement => {
            return movement.variantId === item.variantId;
        });

        if (
            reason === "OPENING" &&
            (
                item.stock !== 0 ||
                hasMovement ||
                item.hasMovements === true
            )
        ) {
            return "Opening stock is only allowed for a size " +
                "with zero stock and no previous movements.";
        }

        const newStock = calculateNewStock(
            item.stock,
            quantity
        );

        if (newStock > 1000000000) {
            return "The resulting stock quantity is too large.";
        }

        return "";
    }


    // =========================
    // CONFIRM MOVEMENT
    // =========================

    function confirmMovement(event) {
        event.preventDefault();

        if (submitting) {
            return;
        }

        if (!elements.form.reportValidity()) {
            return;
        }

        const item = getSelectedVariant();

        const quantity = Number(
            elements.quantity.value
        );

        const validationMessage =
            validateMovement(item, quantity);

        if (validationMessage) {
            elements.error.textContent =
                validationMessage;

            return;
        }

        submitting = true;

        elements.confirm.disabled = true;

        try {
            const previousStock = item.stock;

            const newStock = calculateNewStock(
                previousStock,
                quantity
            );

            // Data shape for future backend integration.
            // The backend must generate its own authoritative
            // timestamp, admin identity, and stock balances.
            const movement = {
                movementId: crypto.randomUUID(),

                variantId: item.variantId,
                productId: item.productId,

                movementType,

                quantity,

                previousStock,
                newStock,

                reason: elements.reason.value,

                reference:
                    elements.reference.value.trim(),

                notes:
                    elements.notes.value.trim(),

                createdAt: new Date().toISOString(),

                recordedBy: "Front-end preview"
            };

            /*
             * FRONT-END PREVIEW ONLY
             *
             * Later, submit the movement to your backend here.
             * Update the UI only after the server confirms success.
             *
             * Currently, this changes only the loaded JavaScript
             * data. Nothing is written to a database.
             */

            movementHistory.push(movement);

            item.stock = newStock;

            item.hasMovements = true;

            elements.modal.close();

            const label = movementType === "IN"
                ? "Stock In"
                : "Stock Out";

            showToast(
                label + " recorded in the front-end preview."
            );

            // Your inventory page can listen to this event
            // and redraw its table and summary.
            document.dispatchEvent(
                new CustomEvent("stock:updated", {
                    detail: {
                        movement: { ...movement },
                        item: { ...item }
                    }
                })
            );

        } catch (error) {
            console.error(error);

            elements.error.textContent =
                "The stock movement could not be recorded.";

        } finally {
            submitting = false;

            elements.confirm.disabled =
                !getSelectedVariant();
        }
    }


    // =========================
    // TOAST
    // =========================

    function showToast(message) {
        clearTimeout(toastTimer);

        elements.toast.textContent = message;

        elements.toast.hidden = false;

        toastTimer = setTimeout(() => {
            elements.toast.hidden = true;
        }, 4000);
    }


    // =========================
    // INITIALIZE
    // =========================

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeStockMovements
        );
    } else {
        initializeStockMovements();
    }
})();