// ==================================================
// NEW PURCHASE ORDER
// Frontend Version
// Prepared for Future Backend / Database Integration
// ==================================================


// ==================================================
// STATE
// ==================================================

let currentPOStep = 2;

let selectedPOSupplier = null;

let purchaseOrderItems = [];


// ==================================================
// MOCK DATA
// FRONTEND DEVELOPMENT ONLY
//
// Replace these arrays with API/database data later.
// Keep the same object structure so the UI functions
// will not need to be rewritten.
// ==================================================


// =========================
// MOCK SUPPLIERS
// =========================

let poSuppliers = [
    {
        supplierId: 1,
        name: "ABC Steel Supply",
        contact: "Juan Dela Cruz",
        phone: "0912-345-6789",
        email: "abcsteel@example.com"
    },
    {
        supplierId: 2,
        name: "Metro Metal Trading",
        contact: "Maria Santos",
        phone: "0917-555-0123",
        email: "metrometal@example.com"
    },
    {
        supplierId: 3,
        name: "Prime Steel Corporation",
        contact: "Roberto Reyes",
        phone: "0918-234-5678",
        email: "primesteel@example.com"
    },
    {
        supplierId: 4,
        name: "North Metal Supply",
        contact: "Angela Cruz",
        phone: "0920-456-7890",
        email: "northmetal@example.com"
    }
];


// =========================
// MOCK PRODUCTS
// =========================
//
// productId = main product
// variantId = exact size/type/variant
//
// This is important later because one product
// may have multiple sizes in the database.
// =========================

let poProducts = [
    {
        productId: 1,
        variantId: 1,
        sku: "PRD-001",
        name: "Steel Angle Bar",
        variant: "2x2x5mm",
        unit: "pc"
    },
    {
        productId: 2,
        variantId: 2,
        sku: "PRD-002",
        name: "Roofing Sheet",
        variant: "0.4mm x 8ft",
        unit: "pc"
    },
    {
        productId: 3,
        variantId: 3,
        sku: "PRD-003",
        name: "Flat Bar",
        variant: "1/8 x 1 inch",
        unit: "pc"
    },
    {
        productId: 4,
        variantId: 4,
        sku: "PRD-004",
        name: "Square Tube",
        variant: "2x2 x 1.5mm",
        unit: "pc"
    },
    {
        productId: 5,
        variantId: 5,
        sku: "PRD-005",
        name: "Steel Pipe",
        variant: "2 inch",
        unit: "pc"
    }
];


// ==================================================
// OPEN MODAL
// ==================================================

function openPurchaseOrderModal() {

    const overlay =
        document.getElementById("purchaseOrderOverlay");

    if (!overlay) {
        return;
    }

    resetPurchaseOrderForm();

    overlay.classList.add("show");

    // Prevent page behind modal from scrolling
    document.body.style.overflow = "hidden";
}


// ==================================================
// CLOSE MODAL
// ==================================================

function closePurchaseOrderModal() {

    const overlay =
        document.getElementById("purchaseOrderOverlay");

    if (!overlay) {
        return;
    }

    overlay.classList.remove("show");

    document.body.style.overflow = "";
}


// ==================================================
// INITIALIZE MODAL
// ==================================================

function initializePurchaseOrderModal() {

    const overlay =
        document.getElementById("purchaseOrderOverlay");

    if (!overlay) {
        return;
    }

    const closeButton =
        document.getElementById("closePurchaseOrder");

    const cancelButton =
        document.getElementById("poCancelBtn");

    const nextButton =
        document.getElementById("poNextBtn");

    const backButton =
        document.getElementById("poBackBtn");

    const createButton =
        document.getElementById("poCreateBtn");

    const draftButton =
        document.getElementById("poDraftBtn");

    const changeSupplierButton =
        document.getElementById("changeSupplierBtn");


    // CLOSE BUTTON
    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closePurchaseOrderModal
        );
    }


    // CANCEL BUTTON
    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closePurchaseOrderModal
        );
    }


    // NEXT BUTTON
    if (nextButton) {

        nextButton.addEventListener(
            "click",
            goToNextPOStep
        );
    }


    // BACK BUTTON
    if (backButton) {

        backButton.addEventListener(
            "click",
            goToPreviousPOStep
        );
    }


    // CREATE PURCHASE ORDER
    if (createButton) {

        createButton.addEventListener(
            "click",
            createPurchaseOrder
        );
    }


    // SAVE DRAFT
    if (draftButton) {

        draftButton.addEventListener(
            "click",
            savePurchaseOrderDraft
        );
    }


    // CHANGE SUPPLIER
    if (changeSupplierButton) {

        changeSupplierButton.addEventListener(
            "click",
            clearSelectedSupplier
        );
    }


    // CLICK OUTSIDE MODAL
    overlay.addEventListener(
        "click",
        function (event) {

            if (event.target === overlay) {

                closePurchaseOrderModal();
            }
        }
    );


    setupSupplierSearch();

    setupProductSearch();

    setDefaultPODate();

    updatePOStep();
}


// ==================================================
// STEP NAVIGATION
// ==================================================


// =========================
// NEXT STEP
// =========================

function goToNextPOStep() {

    if (!validateCurrentPOStep()) {
        return;
    }

    if (currentPOStep < 4) {

        currentPOStep++;

        updatePOStep();

        scrollPOModalToTop();
    }
}


// =========================
// PREVIOUS STEP
// =========================

function goToPreviousPOStep() {

    if (currentPOStep > 1) {

        currentPOStep--;

        updatePOStep();

        scrollPOModalToTop();
    }
}


// =========================
// UPDATE CURRENT STEP
// =========================

function updatePOStep() {

    const steps =
        document.querySelectorAll(".po-step");

    const progressItems =
        document.querySelectorAll(
            ".po-progress-item"
        );


    // SHOW CURRENT STEP
    steps.forEach(function (step) {

        const stepNumber =
            Number(step.dataset.step);

        step.classList.toggle(
            "active",
            stepNumber === currentPOStep
        );
    });


    // UPDATE PROGRESS
    progressItems.forEach(function (item) {

        const progressNumber =
            Number(item.dataset.progress);

        item.classList.toggle(
            "active",
            progressNumber === currentPOStep
        );

        item.classList.toggle(
            "completed",
            progressNumber < currentPOStep
        );
    });


    updatePOFooter();


    // STEP 1
    // ALWAYS SHOW SUPPLIERS
    if (
        currentPOStep === 1 &&
        !selectedPOSupplier
    ) {

        renderSupplierResults(
            getFilteredSuppliers()
        );
    }


    // STEP 2
    // ALWAYS SHOW PRODUCTS
    if (currentPOStep === 2) {

        renderProductResults(
            getFilteredProducts()
        );
    }


    // STEP 4
    // GENERATE REVIEW
    if (currentPOStep === 4) {

        populatePOReview();
    }
}


// =========================
// SCROLL MODAL TO TOP
// =========================

function scrollPOModalToTop() {

    const modalBody =
        document.querySelector(
            ".po-modal-body"
        );

    if (!modalBody) {
        return;
    }

    modalBody.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==================================================
// FOOTER
// ==================================================

// ==================================================
// FOOTER
// ==================================================

function updatePOFooter() {

    const backButton =
        document.getElementById("poBackBtn");

    const cancelButton =
        document.getElementById("poCancelBtn");

    const nextButton =
        document.getElementById("poNextBtn");

    const createButton =
        document.getElementById("poCreateBtn");


    // =========================
    // STEP 1 - SUPPLIER
    // Cancel + Next
    // =========================

    if (currentPOStep === 1) {

        if (backButton) {
            backButton.hidden = true;
        }

        if (cancelButton) {
            cancelButton.hidden = false;
        }

        if (nextButton) {
            nextButton.hidden = false;
        }

        if (createButton) {
            createButton.hidden = true;
        }

        return;
    }


    // =========================
    // STEP 2 - PRODUCTS
    // Back + Next
    // =========================

    if (currentPOStep === 2) {

        if (backButton) {
            backButton.hidden = false;
        }

        if (cancelButton) {
            cancelButton.hidden = true;
        }

        if (nextButton) {
            nextButton.hidden = false;
        }

        if (createButton) {
            createButton.hidden = true;
        }

        return;
    }


    // =========================
    // STEP 3 - ORDER DETAILS
    // Back + Next
    // =========================

    if (currentPOStep === 3) {

        if (backButton) {
            backButton.hidden = false;
        }

        if (cancelButton) {
            cancelButton.hidden = true;
        }

        if (nextButton) {
            nextButton.hidden = false;
        }

        if (createButton) {
            createButton.hidden = true;
        }

        return;
    }


    // =========================
    // STEP 4 - REVIEW
    // Back + Create
    // =========================

    if (currentPOStep === 4) {

        if (backButton) {
            backButton.hidden = false;
        }

        if (cancelButton) {
            cancelButton.hidden = true;
        }

        if (nextButton) {
            nextButton.hidden = true;
        }

        if (createButton) {
            createButton.hidden = false;
        }
    }
}
// ==================================================
// VALIDATION
// ==================================================

function validateCurrentPOStep() {

    // STEP 1
    // SUPPLIER
    if (currentPOStep === 1) {

        if (!selectedPOSupplier) {

            alert(
                "Please select a supplier before continuing."
            );

            return false;
        }
    }


    // STEP 2
    // PRODUCTS
    if (currentPOStep === 2) {

        if (purchaseOrderItems.length === 0) {

            alert(
                "Please add at least one product before continuing."
            );

            return false;
        }


        for (const item of purchaseOrderItems) {

            if (
                !Number.isFinite(item.quantity) ||
                item.quantity <= 0
            ) {

                alert(
                    "Please enter a valid quantity for all products."
                );

                return false;
            }


            if (
                !Number.isFinite(item.unitCost) ||
                item.unitCost < 0
            ) {

                alert(
                    "Please enter a valid unit cost for all products."
                );

                return false;
            }
        }
    }


    // STEP 3
    // ORDER INFORMATION
    if (currentPOStep === 3) {

        const orderDate =
            document.getElementById(
                "poOrderDate"
            );

        const paymentTerms =
            document.getElementById(
                "poPaymentTerms"
            );


        if (
            !orderDate ||
            !orderDate.value
        ) {

            alert(
                "Please select an order date."
            );

            return false;
        }


        if (
            !paymentTerms ||
            !paymentTerms.value
        ) {

            alert(
                "Please select payment terms."
            );

            return false;
        }
    }


    return true;
}


// ==================================================
// SUPPLIERS
// ==================================================


// =========================
// SUPPLIER SEARCH
// =========================

function setupSupplierSearch() {

    const searchInput =
        document.getElementById(
            "poSupplierSearch"
        );

    if (!searchInput) {
        return;
    }


    // Search is optional.
    // Suppliers remain visible when empty.
    searchInput.addEventListener(
        "input",
        function () {

            renderSupplierResults(
                getFilteredSuppliers()
            );
        }
    );


    // Show suppliers when clicking search field
    searchInput.addEventListener(
        "focus",
        function () {

            if (!selectedPOSupplier) {

                renderSupplierResults(
                    getFilteredSuppliers()
                );
            }
        }
    );
}


// =========================
// FILTER SUPPLIERS
// =========================

function getFilteredSuppliers() {

    const searchInput =
        document.getElementById(
            "poSupplierSearch"
        );

    if (!searchInput) {
        return poSuppliers;
    }


    const searchValue =
        searchInput.value
            .trim()
            .toLowerCase();


    // Empty search = show all
    if (!searchValue) {
        return poSuppliers;
    }


    return poSuppliers.filter(
        function (supplier) {

            return (
                supplier.name
                    .toLowerCase()
                    .includes(searchValue) ||

                supplier.contact
                    .toLowerCase()
                    .includes(searchValue) ||

                supplier.phone
                    .toLowerCase()
                    .includes(searchValue) ||

                supplier.email
                    .toLowerCase()
                    .includes(searchValue)
            );
        }
    );
}


// =========================
// RENDER SUPPLIERS
// =========================

function renderSupplierResults(results) {

    const container =
        document.getElementById(
            "poSupplierResults"
        );

    if (!container) {
        return;
    }


    container.hidden = false;


    if (results.length === 0) {

        container.innerHTML = `
            <div class="po-empty-selection">

                <div class="po-empty-symbol">
                    S
                </div>

                <strong>
                    No suppliers found
                </strong>

                <p>
                    Try searching for another supplier.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML = "";


    results.forEach(
        function (supplier) {

            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.className =
                "po-supplier-option";

            button.dataset.supplierId =
                supplier.supplierId;


            const information =
                document.createElement("div");

            const name =
                document.createElement("strong");

            const contact =
                document.createElement("span");

            const selectText =
                document.createElement("span");


            name.textContent =
                supplier.name;

            contact.textContent =
                supplier.contact;

            selectText.textContent =
                "Select";


            information.appendChild(name);

            information.appendChild(contact);

            button.appendChild(information);

            button.appendChild(selectText);


            button.addEventListener(
                "click",
                function () {

                    selectPOSupplier(
                        supplier
                    );
                }
            );


            container.appendChild(
                button
            );
        }
    );
}


// =========================
// SELECT SUPPLIER
// =========================

function selectPOSupplier(supplier) {

    selectedPOSupplier =
        supplier;


    const results =
        document.getElementById(
            "poSupplierResults"
        );

    const selectedBox =
        document.getElementById(
            "poSelectedSupplier"
        );

    const searchInput =
        document.getElementById(
            "poSupplierSearch"
        );


    if (results) {
        results.hidden = true;
    }


    if (selectedBox) {
        selectedBox.hidden = false;
    }


    if (searchInput) {

        searchInput.value =
            supplier.name;
    }


    setText(
        "selectedSupplierName",
        supplier.name
    );

    setText(
        "selectedSupplierContact",
        supplier.contact
    );

    setText(
        "selectedSupplierPhone",
        supplier.phone
    );

    setText(
        "selectedSupplierEmail",
        supplier.email
    );
}


// =========================
// CHANGE SUPPLIER
// =========================

function clearSelectedSupplier() {

    selectedPOSupplier = null;


    const results =
        document.getElementById(
            "poSupplierResults"
        );

    const selectedBox =
        document.getElementById(
            "poSelectedSupplier"
        );

    const searchInput =
        document.getElementById(
            "poSupplierSearch"
        );


    if (selectedBox) {
        selectedBox.hidden = true;
    }


    if (searchInput) {
        searchInput.value = "";
    }


    if (results) {
        results.hidden = false;
    }


    renderSupplierResults(
        poSuppliers
    );
}


// ==================================================
// PRODUCTS
// ==================================================


// =========================
// PRODUCT SEARCH
// =========================

function setupProductSearch() {

    const searchInput =
        document.getElementById(
            "poProductSearch"
        );

    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        "input",
        function () {

            renderProductResults(
                getFilteredProducts()
            );
        }
    );


    searchInput.addEventListener(
        "focus",
        function () {

            renderProductResults(
                getFilteredProducts()
            );
        }
    );
}


// =========================
// FILTER PRODUCTS
// =========================

function getFilteredProducts() {

    const searchInput =
        document.getElementById(
            "poProductSearch"
        );

    if (!searchInput) {
        return poProducts;
    }


    const searchValue =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!searchValue) {
        return poProducts;
    }


    return poProducts.filter(
        function (product) {

            return (
                product.name
                    .toLowerCase()
                    .includes(searchValue) ||

                product.sku
                    .toLowerCase()
                    .includes(searchValue) ||

                product.variant
                    .toLowerCase()
                    .includes(searchValue) ||

                product.unit
                    .toLowerCase()
                    .includes(searchValue)
            );
        }
    );
}


// =========================
// RENDER PRODUCTS
// =========================

function renderProductResults(results) {

    const container =
        document.getElementById(
            "poProductResults"
        );

    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (results.length === 0) {

        container.innerHTML = `
            <div class="po-empty-selection">

                <div class="po-empty-symbol">
                    P
                </div>

                <strong>
                    No products found
                </strong>

                <p>
                    Try searching for another product.
                </p>

            </div>
        `;

        return;
    }


    results.forEach(
        function (product) {

            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.className =
                "po-product-option";

            button.dataset.productId =
                product.productId;

            button.dataset.variantId =
                product.variantId;


            const information =
                document.createElement("div");

            const name =
                document.createElement("strong");

            const details =
                document.createElement("span");

            const addText =
                document.createElement("span");


            name.textContent =
                product.name;

            details.textContent =
                `${product.sku} • ${product.variant} • ${product.unit}`;

            addText.textContent =
                "+ Add";


            information.appendChild(name);

            information.appendChild(details);

            button.appendChild(information);

            button.appendChild(addText);


            button.addEventListener(
                "click",
                function () {

                    addPOProduct(
                        product
                    );
                }
            );


            container.appendChild(
                button
            );
        }
    );
}


// =========================
// ADD PRODUCT
// =========================

function addPOProduct(product) {

    const existingItem =
        purchaseOrderItems.find(
            function (item) {

                return (
                    item.variantId ===
                    product.variantId
                );
            }
        );


    // Same exact variant already added
    if (existingItem) {

        existingItem.quantity++;

    } else {

        purchaseOrderItems.push({

            productId:
                product.productId,

            variantId:
                product.variantId,

            sku:
                product.sku,

            name:
                product.name,

            variant:
                product.variant,

            unit:
                product.unit,

            quantity: 1,

            unitCost: 0
        });
    }


    renderPOItems();


    const searchInput =
        document.getElementById(
            "poProductSearch"
        );


    if (searchInput) {
        searchInput.value = "";
    }


    // Keep products visible for fast entry
    renderProductResults(
        poProducts
    );
}


// ==================================================
// PURCHASE ORDER ITEMS
// ==================================================

function renderPOItems() {

    const body =
        document.getElementById(
            "poItemsBody"
        );

    const empty =
        document.getElementById(
            "poItemsEmpty"
        );


    if (!body || !empty) {
        return;
    }


    body.innerHTML = "";


    if (purchaseOrderItems.length === 0) {

        empty.style.display = "flex";

    } else {

        empty.style.display = "none";
    }


    purchaseOrderItems.forEach(
        function (item, index) {

            const row =
                document.createElement(
                    "tr"
                );


            const subtotal =
                item.quantity *
                item.unitCost;


            row.innerHTML = `
                <td>
                    <strong>
                        ${escapeHTML(item.name)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(item.variant)}
                </td>

                <td>
                    ${escapeHTML(item.unit)}
                </td>

                <td>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value="${item.quantity}"
                        data-index="${index}"
                        class="po-quantity-input"
                    >
                </td>

                <td>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value="${item.unitCost}"
                        data-index="${index}"
                        class="po-cost-input"
                    >
                </td>

                <td>
                    ${formatPeso(subtotal)}
                </td>

                <td>
                    <button
                        type="button"
                        class="po-remove-item"
                        data-index="${index}"
                        aria-label="Remove ${escapeHTML(item.name)}"
                    >
                        ×
                    </button>
                </td>
            `;


            body.appendChild(
                row
            );
        }
    );


    setupPOItemEvents();

    updatePOTotals();
}


// =========================
// ITEM EVENTS
// =========================

function setupPOItemEvents() {

    // QUANTITY
    document
        .querySelectorAll(
            ".po-quantity-input"
        )
        .forEach(
            function (input) {

                input.addEventListener(
                    "change",
                    function () {

                        const index =
                            Number(
                                input.dataset.index
                            );


                        const quantity =
                            Number(
                                input.value
                            );


                        purchaseOrderItems[
                            index
                        ].quantity =
                            Math.max(
                                1,
                                Number.isFinite(quantity)
                                    ? Math.floor(quantity)
                                    : 1
                            );


                        renderPOItems();
                    }
                );
            }
        );


    // UNIT COST
    document
        .querySelectorAll(
            ".po-cost-input"
        )
        .forEach(
            function (input) {

                input.addEventListener(
                    "change",
                    function () {

                        const index =
                            Number(
                                input.dataset.index
                            );


                        const unitCost =
                            Number(
                                input.value
                            );


                        purchaseOrderItems[
                            index
                        ].unitCost =
                            Math.max(
                                0,
                                Number.isFinite(unitCost)
                                    ? unitCost
                                    : 0
                            );


                        renderPOItems();
                    }
                );
            }
        );


    // REMOVE
    document
        .querySelectorAll(
            ".po-remove-item"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.index
                            );


                        purchaseOrderItems.splice(
                            index,
                            1
                        );


                        renderPOItems();
                    }
                );
            }
        );
}


// ==================================================
// TOTALS
// ==================================================

function calculatePOTotal() {

    return purchaseOrderItems.reduce(
        function (sum, item) {

            return (
                sum +
                (
                    item.quantity *
                    item.unitCost
                )
            );
        },
        0
    );
}


function updatePOTotals() {

    const total =
        calculatePOTotal();


    setText(
        "poOrderSubtotal",
        formatPeso(total)
    );


    const count =
        purchaseOrderItems.length;


    setText(
        "poItemCount",
        count +
        (
            count === 1
                ? " item"
                : " items"
        )
    );
}


// ==================================================
// PO INFORMATION
// ==================================================


// =========================
// TEMPORARY PO NUMBER
// =========================

function generatePONumber() {

    const year =
        new Date().getFullYear();


    /*
        FRONTEND PROTOTYPE ONLY

        DO NOT use this as the final database
        PO number.

        The backend/database should generate
        and guarantee the real unique PO number.
    */

    const temporarySequence =
        String(
            Date.now()
        ).slice(-4);


    return (
        "PO-" +
        year +
        "-" +
        temporarySequence
    );
}


// =========================
// DEFAULT ORDER DATE
// =========================

function setDefaultPODate() {

    const dateInput =
        document.getElementById(
            "poOrderDate"
        );


    if (!dateInput) {
        return;
    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    dateInput.value =
        `${year}-${month}-${day}`;
}


// ==================================================
// REVIEW
// ==================================================

function populatePOReview() {

    const poNumber =
        document.getElementById(
            "poNumber"
        )?.value || "—";


    const orderDate =
        document.getElementById(
            "poOrderDate"
        )?.value || "";


    const paymentTerms =
        document.getElementById(
            "poPaymentTerms"
        )?.value || "—";


    const notes =
        document.getElementById(
            "poNotes"
        )?.value.trim() ||
        "No remarks.";


    setText(
        "reviewPONumber",
        poNumber
    );


    setText(
        "reviewOrderDate",
        formatPODate(orderDate)
    );


    setText(
        "reviewSupplierName",
        selectedPOSupplier
            ? selectedPOSupplier.name
            : "—"
    );


    setText(
        "reviewSupplierContact",
        selectedPOSupplier
            ? selectedPOSupplier.contact
            : "—"
    );


    setText(
        "reviewPaymentTerms",
        paymentTerms
    );


    setText(
        "reviewNotes",
        notes
    );


    renderPOReviewItems();
}


// =========================
// REVIEW ITEMS
// =========================

function renderPOReviewItems() {

    const body =
        document.getElementById(
            "poReviewItemsBody"
        );


    if (!body) {
        return;
    }


    body.innerHTML = "";


    purchaseOrderItems.forEach(
        function (item) {

            const subtotal =
                item.quantity *
                item.unitCost;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `
                <td>
                    ${escapeHTML(item.name)}
                </td>

                <td>
                    ${escapeHTML(item.variant)}
                </td>

                <td>
                    ${item.quantity}
                </td>

                <td>
                    ${formatPeso(item.unitCost)}
                </td>

                <td>
                    ${formatPeso(subtotal)}
                </td>
            `;


            body.appendChild(row);
        }
    );


    setText(
        "reviewTotalAmount",
        formatPeso(
            calculatePOTotal()
        )
    );
}


// ==================================================
// BUILD BACKEND-READY DATA
// ==================================================

function buildPurchaseOrderData(status = "Ordered") {

    return {

        /*
            Temporary display number only.

            Backend should generate/return
            the official PO number.
        */

        temporaryPONumber:
            document.getElementById(
                "poNumber"
            )?.value || "",


        // Store database ID instead of entire supplier
        supplierId:
            selectedPOSupplier
                ? selectedPOSupplier.supplierId
                : null,


        orderDate:
            document.getElementById(
                "poOrderDate"
            )?.value || "",


        paymentTerms:
            document.getElementById(
                "poPaymentTerms"
            )?.value || "",


        reference:
            document.getElementById(
                "poReference"
            )?.value.trim() || "",


        notes:
            document.getElementById(
                "poNotes"
            )?.value.trim() || "",


        items:
            purchaseOrderItems.map(
                function (item) {

                    return {

                        productId:
                            item.productId,

                        variantId:
                            item.variantId,

                        quantity:
                            item.quantity,

                        unitCost:
                            item.unitCost
                    };
                }
            ),


        totalAmount:
            calculatePOTotal(),


        status:
            status
    };
}


// ==================================================
// CREATE PURCHASE ORDER
// ==================================================

function createPurchaseOrder() {

    if (!validateFinalPurchaseOrder()) {
        return;
    }


    const purchaseOrderData =
        buildPurchaseOrderData(
            "Ordered"
        );


    submitPurchaseOrder(
        purchaseOrderData
    );
}


// ==================================================
// SAVE DRAFT
// ==================================================

function savePurchaseOrderDraft() {

    const purchaseOrderData =
        buildPurchaseOrderData(
            "Draft"
        );


    submitPurchaseOrderDraft(
        purchaseOrderData
    );
}


// ==================================================
// FINAL VALIDATION
// ==================================================

function validateFinalPurchaseOrder() {

    if (!selectedPOSupplier) {

        alert(
            "Please select a supplier."
        );

        return false;
    }


    if (purchaseOrderItems.length === 0) {

        alert(
            "Please add at least one product."
        );

        return false;
    }


    for (const item of purchaseOrderItems) {

        if (item.quantity <= 0) {

            alert(
                "All products must have a valid quantity."
            );

            return false;
        }


        if (item.unitCost < 0) {

            alert(
                "All products must have a valid unit cost."
            );

            return false;
        }
    }


    const orderDate =
        document.getElementById(
            "poOrderDate"
        );


    if (
        !orderDate ||
        !orderDate.value
    ) {

        alert(
            "Please select an order date."
        );

        return false;
    }


    const paymentTerms =
        document.getElementById(
            "poPaymentTerms"
        );


    if (
        !paymentTerms ||
        !paymentTerms.value
    ) {

        alert(
            "Please select payment terms."
        );

        return false;
    }


    return true;
}


// ==================================================
// BACKEND INTEGRATION POINT
// CREATE
// ==================================================

async function submitPurchaseOrder(
    purchaseOrderData
) {

    /*
        FRONTEND DEVELOPMENT ONLY

        purchaseOrderData is now ready
        to be sent to your backend.

        Example future PHP integration:

        const response = await fetch(
            "api/purchase-orders/create.php",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(
                    purchaseOrderData
                )
            }
        );

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Unable to create purchase order."
            );
        }

        The backend should return something like:

        {
            success: true,
            purchaseOrderId: 25,
            poNumber: "PO-2026-0025"
        }
    */


    console.log(
        "PURCHASE ORDER READY FOR BACKEND:",
        purchaseOrderData
    );


    alert(
        "Purchase order is ready for database integration."
    );


    closePurchaseOrderModal();

    resetPurchaseOrderForm();
}


// ==================================================
// BACKEND INTEGRATION POINT
// DRAFT
// ==================================================

async function submitPurchaseOrderDraft(
    purchaseOrderData
) {

    /*
        Future backend:

        POST
        api/purchase-orders/draft.php

        or use the same endpoint as create.php
        and distinguish using:

        status: "Draft"
    */


    console.log(
        "PURCHASE ORDER DRAFT READY FOR BACKEND:",
        purchaseOrderData
    );


    alert(
        "Purchase order draft is ready for database integration."
    );
}


// ==================================================
// FUTURE DATABASE LOADERS
// ==================================================


// =========================
// LOAD SUPPLIERS
// =========================

async function loadPOSuppliers() {

    /*
        FRONTEND MODE:

        We currently use the mock poSuppliers array.


        FUTURE DATABASE VERSION:

        const response = await fetch(
            "api/suppliers/list.php"
        );

        if (!response.ok) {
            throw new Error(
                "Unable to load suppliers."
            );
        }

        poSuppliers =
            await response.json();

        renderSupplierResults(
            poSuppliers
        );
    */


    renderSupplierResults(
        poSuppliers
    );
}


// =========================
// LOAD PRODUCTS
// =========================

async function loadPOProducts() {

    /*
        FRONTEND MODE:

        We currently use the mock poProducts array.


        FUTURE DATABASE VERSION:

        const response = await fetch(
            "api/products/list-for-purchase.php"
        );

        if (!response.ok) {
            throw new Error(
                "Unable to load products."
            );
        }

        poProducts =
            await response.json();

        renderProductResults(
            poProducts
        );
    */


    renderProductResults(
        poProducts
    );
}


// ==================================================
// RESET
// ==================================================

function resetPurchaseOrderForm() {

    currentPOStep = 1;

    selectedPOSupplier = null;

    purchaseOrderItems = [];


    // =========================
    // PO NUMBER
    // =========================

    const poNumber =
        document.getElementById(
            "poNumber"
        );


    if (poNumber) {

        poNumber.value =
            generatePONumber();
    }


    // =========================
    // SEARCH
    // =========================

    const supplierSearch =
        document.getElementById(
            "poSupplierSearch"
        );

    const productSearch =
        document.getElementById(
            "poProductSearch"
        );


    if (supplierSearch) {
        supplierSearch.value = "";
    }


    if (productSearch) {
        productSearch.value = "";
    }


    // =========================
    // ORDER DETAILS
    // =========================

    const paymentTerms =
        document.getElementById(
            "poPaymentTerms"
        );

    const reference =
        document.getElementById(
            "poReference"
        );

    const notes =
        document.getElementById(
            "poNotes"
        );


    if (paymentTerms) {
        paymentTerms.value = "";
    }


    if (reference) {
        reference.value = "";
    }


    if (notes) {
        notes.value = "";
    }


    // =========================
    // SELECTED SUPPLIER
    // =========================

    const selectedSupplier =
        document.getElementById(
            "poSelectedSupplier"
        );


    if (selectedSupplier) {
        selectedSupplier.hidden = true;
    }


    // =========================
    // LOAD SUPPLIERS
    // =========================

    loadPOSuppliers();


    // =========================
    // LOAD PRODUCTS
    // =========================

    loadPOProducts();


    // =========================
    // ITEMS
    // =========================

    renderPOItems();


    // =========================
    // DATE
    // =========================

    setDefaultPODate();


    // =========================
    // STEP
    // =========================

    updatePOStep();

    scrollPOModalToTop();
}


// ==================================================
// HELPERS
// ==================================================


// =========================
// FORMAT PESO
// =========================

function formatPeso(value) {

    const numericValue =
        Number(value) || 0;


    return new Intl.NumberFormat(
        "en-PH",
        {
            style: "currency",
            currency: "PHP"
        }
    ).format(
        numericValue
    );
}


// =========================
// FORMAT DATE
// =========================

function formatPODate(value) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(
            value + "T00:00:00"
        );


    return date.toLocaleDateString(
        "en-US",
        {
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
}


// =========================
// SET TEXT
// =========================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;
    }
}


// =========================
// ESCAPE HTML
// =========================
//
// Useful when values eventually come
// from your database/API.
// =========================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ==================================================
// ESCAPE KEY
// ==================================================

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {
            return;
        }


        const overlay =
            document.getElementById(
                "purchaseOrderOverlay"
            );


        if (
            overlay &&
            overlay.classList.contains(
                "show"
            )
        ) {

            closePurchaseOrderModal();
        }
    }
);