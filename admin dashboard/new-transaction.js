/* =========================
   NEW TRANSACTION
========================= */

let currentTransactionStep = 1;

let transactionItems = [];
let fabricationItems = [];


/*
    Temporary products for frontend testing.

    Later, replace this with products
    retrieved from the database.
*/
const transactionProducts = [
    {
        id: "PRD-001",
        name: "Angle Bar",
        variant: "2 x 2",
        stock: 48,
        unit: "pc",
        referencePrice: 450
    },
    {
        id: "PRD-002",
        name: "GI Sheet",
        variant: "0.5mm",
        stock: 30,
        unit: "pc",
        referencePrice: 1250
    },
    {
        id: "PRD-003",
        name: "Square Tube",
        variant: "2 x 2",
        stock: 25,
        unit: "pc",
        referencePrice: 780
    }
];


/* =========================
   INITIALIZE
========================= */

function initializeTransactionModal() {

    populateTransactionProducts();

    setupTransactionButtons();

    setupCustomerType();

    setupFabrication();

    setupPayment();

    showTransactionStep(1);

    updateTransactionSummary();
}


/* =========================
   PRODUCT SELECT
========================= */

function populateTransactionProducts() {

    const productSelect =
        document.getElementById("transactionProduct");

    if (!productSelect) {
        return;
    }


    transactionProducts.forEach(function (product) {

        const option =
            document.createElement("option");


        option.value = product.id;

        option.textContent =
            product.name +
            " - " +
            product.variant +
            " | Stock: " +
            product.stock +
            " " +
            product.unit;


        productSelect.appendChild(option);

    });

}


/* =========================
   BUTTONS
========================= */

function setupTransactionButtons() {

    const closeButton =
        document.getElementById("closeTransactionBtn");

    const cancelButton =
        document.getElementById("transactionCancelBtn");

    const backButton =
        document.getElementById("transactionBackBtn");

    const nextButton =
        document.getElementById("transactionNextBtn");

    const addItemButton =
        document.getElementById("addTransactionItem");


    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeTransactionModal
        );
    }


    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            closeTransactionModal
        );
    }


    if (backButton) {

        backButton.addEventListener(
            "click",
            function () {

                if (currentTransactionStep > 1) {

                    currentTransactionStep--;

                    showTransactionStep(
                        currentTransactionStep
                    );

                }

            }
        );

    }


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            function () {

                if (currentTransactionStep === 2) {

                    if (transactionItems.length === 0) {

                        alert(
                            "Please add at least one product."
                        );

                        return;
                    }

                }


                if (currentTransactionStep < 4) {

                    currentTransactionStep++;

                    showTransactionStep(
                        currentTransactionStep
                    );

                    return;
                }


                completeTransaction();

            }
        );

    }


    if (addItemButton) {

        addItemButton.addEventListener(
            "click",
            addTransactionItem
        );

    }

}


/* =========================
   CUSTOMER TYPE
========================= */

function setupCustomerType() {

    const options =
        document.querySelectorAll(
            ".type-option"
        );


    options.forEach(function (option) {

        option.addEventListener(
            "click",
            function () {

                options.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                option.classList.add(
                    "active"
                );

            }
        );

    });

}


/* =========================
   SHOW STEP
========================= */

function showTransactionStep(step) {

    const pages =
        document.querySelectorAll(
            ".transaction-page"
        );

    const steps =
        document.querySelectorAll(
            ".transaction-step"
        );


    pages.forEach(function (page) {

        page.classList.remove("active");

    });


    steps.forEach(function (stepElement) {

        const stepNumber =
            Number(
                stepElement.dataset.step
            );


        stepElement.classList.remove(
            "active",
            "completed"
        );


        if (stepNumber === step) {

            stepElement.classList.add(
                "active"
            );

        }


        if (stepNumber < step) {

            stepElement.classList.add(
                "completed"
            );

        }

    });


    const currentPage =
        document.getElementById(
            "transactionStep" + step
        );


    if (currentPage) {

        currentPage.classList.add(
            "active"
        );

    }


    updateTransactionFooter();

}


/* =========================
   FOOTER
========================= */

function updateTransactionFooter() {

    const backButton =
        document.getElementById(
            "transactionBackBtn"
        );

    const nextButton =
        document.getElementById(
            "transactionNextBtn"
        );


    if (!backButton || !nextButton) {
        return;
    }


    backButton.style.visibility =
        currentTransactionStep === 1
            ? "hidden"
            : "visible";


    if (currentTransactionStep === 1) {

        nextButton.textContent =
            "Next: Add Items →";

    }

    else if (currentTransactionStep === 2) {

        nextButton.textContent =
            "Next: Fabrication →";

    }

    else if (currentTransactionStep === 3) {

        nextButton.textContent =
            "Next: Payment →";

    }

    else {

        nextButton.textContent =
            "Complete Transaction";

    }

}


/* =========================
   ADD ITEM
========================= */

function addTransactionItem() {

    const productSelect =
        document.getElementById(
            "transactionProduct"
        );

    const quantityInput =
        document.getElementById(
            "transactionQuantity"
        );


    const productId =
        productSelect.value;

    const quantity =
        Number(quantityInput.value);


    if (!productId) {

        alert("Please select a product.");

        return;
    }


    if (quantity <= 0) {

        alert(
            "Quantity must be greater than zero."
        );

        return;
    }


    const product =
        transactionProducts.find(
            function (item) {

                return item.id === productId;

            }
        );


    if (!product) {
        return;
    }


    if (quantity > product.stock) {

        alert(
            "Not enough stock available."
        );

        return;
    }


    const existingItem =
        transactionItems.find(
            function (item) {

                return item.productId === productId;

            }
        );


    if (existingItem) {

        const newQuantity =
            existingItem.quantity + quantity;


        if (newQuantity > product.stock) {

            alert(
                "Not enough stock available."
            );

            return;
        }


        existingItem.quantity =
            newQuantity;

    }

    else {

        transactionItems.push({

            productId: product.id,

            name: product.name,

            variant: product.variant,

            unit: product.unit,

            stock: product.stock,

            quantity: quantity,

            referencePrice:
                product.referencePrice,

            sellingPrice:
                product.referencePrice

        });

    }


    productSelect.value = "";

    quantityInput.value = 1;


    renderTransactionItems();

    populateFabricationProducts();

    updateTransactionSummary();

}


/* =========================
   RENDER ITEMS
========================= */

function renderTransactionItems() {

    const tableBody =
        document.getElementById(
            "transactionItemsBody"
        );

    const emptyState =
        document.getElementById(
            "itemsEmptyState"
        );

    const itemCount =
        document.getElementById(
            "itemCount"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    if (transactionItems.length === 0) {

        if (emptyState) {
            emptyState.style.display = "flex";
        }

    }

    else {

        if (emptyState) {
            emptyState.style.display = "none";
        }

    }


    transactionItems.forEach(
        function (item, index) {

            const row =
                document.createElement("tr");


            const lineTotal =
                item.quantity *
                item.sellingPrice;


            row.innerHTML = `

                <td>

                    <div class="item-product-name">

                        <strong>
                            ${item.name}
                        </strong>

                        <span>
                            ${item.variant}
                        </span>

                    </div>

                </td>


                <td>
                    ${item.quantity}
                    ${item.unit}
                </td>


                <td>
                    ${formatCurrency(
                        item.referencePrice
                    )}
                </td>


                <td>

                    <input
                        type="number"
                        class="selling-price-input"
                        value="${item.sellingPrice}"
                        min="0"
                        step="0.01"
                        data-index="${index}"
                    >

                </td>


                <td>
                    <strong>
                        ${formatCurrency(
                            lineTotal
                        )}
                    </strong>
                </td>


                <td>

                    <button
                        type="button"
                        class="remove-item-btn"
                        data-index="${index}"
                    >
                        ×
                    </button>

                </td>

            `;


            tableBody.appendChild(row);

        }
    );


    if (itemCount) {

        itemCount.textContent =
            transactionItems.length +
            (
                transactionItems.length === 1
                    ? " Item"
                    : " Items"
            );

    }


    setupItemEvents();

}


/* =========================
   ITEM EVENTS
========================= */

function setupItemEvents() {

    const priceInputs =
        document.querySelectorAll(
            ".selling-price-input"
        );


    priceInputs.forEach(
        function (input) {

            input.addEventListener(
                "input",
                function () {

                    const index =
                        Number(
                            input.dataset.index
                        );


                    let newPrice =
                        Number(input.value);


                    if (newPrice < 0) {
                        newPrice = 0;
                    }


                    transactionItems[index]
                        .sellingPrice =
                        newPrice;


                    renderTransactionItems();

                    updateTransactionSummary();

                }
            );

        }
    );


    const removeButtons =
        document.querySelectorAll(
            ".remove-item-btn"
        );


    removeButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    transactionItems.splice(
                        index,
                        1
                    );


                    renderTransactionItems();

                    populateFabricationProducts();

                    updateTransactionSummary();

                }
            );

        }
    );

}


/* =========================
   FABRICATION
========================= */

function setupFabrication() {

    const toggle =
        document.getElementById(
            "fabricationToggle"
        );

    const addButton =
        document.getElementById(
            "addFabricationBtn"
        );


    if (toggle) {

        toggle.addEventListener(
            "change",
            function () {

                const form =
                    document.getElementById(
                        "fabricationForm"
                    );


                if (!form) {
                    return;
                }


                form.classList.toggle(
                    "show",
                    toggle.checked
                );

            }
        );

    }


    if (addButton) {

        addButton.addEventListener(
            "click",
            addFabricationService
        );

    }

}


/* =========================
   FABRICATION PRODUCTS
========================= */

function populateFabricationProducts() {

    const select =
        document.getElementById(
            "fabricationProduct"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            Select purchased product
        </option>

    `;


    transactionItems.forEach(
        function (item, index) {

            const option =
                document.createElement(
                    "option"
                );


            option.value = index;

            option.textContent =
                item.name +
                " - " +
                item.variant;


            select.appendChild(option);

        }
    );

}


/* =========================
   ADD FABRICATION
========================= */

function addFabricationService() {

    const productSelect =
        document.getElementById(
            "fabricationProduct"
        );

    const serviceSelect =
        document.getElementById(
            "fabricationService"
        );

    const quantityInput =
        document.getElementById(
            "fabricationQuantity"
        );

    const priceInput =
        document.getElementById(
            "fabricationPrice"
        );

    const specificationInput =
        document.getElementById(
            "fabricationSpecification"
        );


    const productIndex =
        Number(productSelect.value);

    const service =
        serviceSelect.value;

    const quantity =
        Number(quantityInput.value);

    const price =
        Number(priceInput.value);


    if (productSelect.value === "") {

        alert(
            "Please select a purchased product."
        );

        return;
    }


    if (!service) {

        alert(
            "Please select a fabrication service."
        );

        return;
    }


    if (quantity <= 0) {

        alert(
            "Fabrication quantity must be greater than zero."
        );

        return;
    }


    if (price < 0) {

        alert(
            "Service charge cannot be negative."
        );

        return;
    }


    const product =
        transactionItems[productIndex];


    fabricationItems.push({

        productId:
            product.productId,

        productName:
            product.name,

        service: service,

        quantity: quantity,

        price: price,

        specification:
            specificationInput.value.trim()

    });


    serviceSelect.value = "";

    quantityInput.value = 1;

    priceInput.value = "";

    specificationInput.value = "";


    renderFabricationItems();

    updateTransactionSummary();

}


/* =========================
   RENDER FABRICATION
========================= */

function renderFabricationItems() {

    const list =
        document.getElementById(
            "fabricationList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = "";


    fabricationItems.forEach(
        function (item, index) {

            const entry =
                document.createElement("div");


            entry.className =
                "fabrication-entry";


            entry.innerHTML = `

                <div>

                    <strong>
                        ${item.productName}
                        — ${item.service}
                    </strong>

                    <p>
                        Qty: ${item.quantity}
                        ·
                        ${formatCurrency(
                            item.price
                        )}
                    </p>

                </div>


                <button
                    type="button"
                    class="remove-fabrication-btn"
                    data-index="${index}"
                >
                    Remove
                </button>

            `;


            list.appendChild(entry);

        }
    );


    const removeButtons =
        document.querySelectorAll(
            ".remove-fabrication-btn"
        );


    removeButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    fabricationItems.splice(
                        index,
                        1
                    );


                    renderFabricationItems();

                    updateTransactionSummary();

                }
            );

        }
    );

}


/* =========================
   SUMMARY
========================= */

function updateTransactionSummary() {

    const productsSubtotal =
        transactionItems.reduce(
            function (total, item) {

                return total +
                    (
                        item.quantity *
                        item.sellingPrice
                    );

            },
            0
        );


    const fabricationSubtotal =
        fabricationItems.reduce(
            function (total, item) {

                return total +
                    item.price;

            },
            0
        );


    const total =
        productsSubtotal +
        fabricationSubtotal;


    setText(
        "productsSubtotal",
        formatCurrency(productsSubtotal)
    );


    setText(
        "fabricationSubtotal",
        formatCurrency(
            fabricationSubtotal
        )
    );


    setText(
        "transactionTotal",
        formatCurrency(total)
    );


    setText(
        "summaryItemCount",
        transactionItems.length
    );


    renderSummaryProducts();

    updatePaymentChange();

}


/* =========================
   SUMMARY PRODUCTS
========================= */

function renderSummaryProducts() {

    const container =
        document.getElementById(
            "summaryProducts"
        );


    if (!container) {
        return;
    }


    if (transactionItems.length === 0) {

        container.innerHTML = `

            <div class="summary-empty">

                <div class="summary-empty-symbol">
                    +
                </div>

                <strong>
                    No items yet
                </strong>

                <p>
                    Add products to this transaction.
                </p>

            </div>

        `;


        return;

    }


    container.innerHTML = "";


    transactionItems.forEach(
        function (item) {

            const total =
                item.quantity *
                item.sellingPrice;


            const product =
                document.createElement(
                    "div"
                );


            product.className =
                "summary-product";


            product.innerHTML = `

                <div class="summary-product-info">

                    <strong>
                        ${item.name}
                    </strong>

                    <span>
                        ${item.quantity}
                        ×
                        ${formatCurrency(
                            item.sellingPrice
                        )}
                    </span>

                </div>


                <strong>
                    ${formatCurrency(total)}
                </strong>

            `;


            container.appendChild(product);

        }
    );

}


/* =========================
   PAYMENT
========================= */

function setupPayment() {

    const amountPaid =
        document.getElementById(
            "amountPaid"
        );


    if (amountPaid) {

        amountPaid.addEventListener(
            "input",
            updatePaymentChange
        );

    }

}


/* =========================
   CHANGE
========================= */

function updatePaymentChange() {

    const amountInput =
        document.getElementById(
            "amountPaid"
        );

    const changeElement =
        document.getElementById(
            "changeAmount"
        );


    if (!amountInput ||
        !changeElement) {

        return;

    }


    const productsSubtotal =
        transactionItems.reduce(
            function (total, item) {

                return total +
                    (
                        item.quantity *
                        item.sellingPrice
                    );

            },
            0
        );


    const fabricationSubtotal =
        fabricationItems.reduce(
            function (total, item) {

                return total +
                    item.price;

            },
            0
        );


    const total =
        productsSubtotal +
        fabricationSubtotal;


    const paid =
        Number(amountInput.value) || 0;


    const change =
        Math.max(
            paid - total,
            0
        );


    changeElement.textContent =
        formatCurrency(change);

}


/* =========================
   COMPLETE
========================= */

function completeTransaction() {

    if (transactionItems.length === 0) {

        alert(
            "Please add at least one product."
        );

        return;
    }


    const total =
        calculateTransactionTotal();


    const amountPaid =
        Number(
            document.getElementById(
                "amountPaid"
            ).value
        ) || 0;


    if (amountPaid < total) {

        alert(
            "The amount paid is less than the total amount."
        );

        return;
    }


    /*
        DATABASE SAVE WILL GO HERE LATER.

        Save:
        - Sale
        - Sale Items
        - Selling Price
        - Reference Price
        - Fabrication Services
        - Payment
        - Inventory movement
    */


    alert(
        "Transaction completed successfully."
    );


    closeTransactionModal();

}


/* =========================
   TOTAL
========================= */

function calculateTransactionTotal() {

    const productTotal =
        transactionItems.reduce(
            function (total, item) {

                return total +
                    (
                        item.quantity *
                        item.sellingPrice
                    );

            },
            0
        );


    const fabricationTotal =
        fabricationItems.reduce(
            function (total, item) {

                return total +
                    item.price;

            },
            0
        );


    return productTotal +
        fabricationTotal;

}


/* =========================
   CLOSE
========================= */

function closeTransactionModal() {

    const overlay =
        document.getElementById(
            "transactionOverlay"
        );


    if (overlay) {

        overlay.remove();

    }

}


/* =========================
   HELPERS
========================= */

function formatCurrency(value) {

    return new Intl.NumberFormat(
        "en-PH",
        {
            style: "currency",
            currency: "PHP"
        }
    ).format(value);

}


function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent = value;

    }

}