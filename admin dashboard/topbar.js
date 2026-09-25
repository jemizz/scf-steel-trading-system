// =========================
// LOAD TOP BAR
// =========================

document.addEventListener("DOMContentLoaded", function () {

    const topbarContainer =
        document.getElementById("topbar");


    if (!topbarContainer) {
        return;
    }


    const pageTitle =
        topbarContainer.dataset.pageTitle || "Dashboard";


    fetch("topbar.html")

        .then(function (response) {

            if (!response.ok) {
                throw new Error(
                    "Could not load topbar.html"
                );
            }

            return response.text();

        })

        .then(function (html) {

            topbarContainer.innerHTML = html;


            // Set page title
            setTopbarTitle(pageTitle);


            // Start date and time
            updateDateTime();

            setInterval(
                updateDateTime,
                1000
            );


            // Start topbar features
            setupQuickAccess();

            setupNotifications();

            updateNotificationBadge();

        })

        .catch(function (error) {

            console.error(
                "Topbar error:",
                error
            );

        });

});


// =========================
// PAGE TITLE
// =========================

function setTopbarTitle(title) {

    const titleElement =
        document.getElementById(
            "topbarPageTitle"
        );


    if (!titleElement) {
        return;
    }


    titleElement.textContent = title;

}


// =========================
// DATE AND TIME
// =========================

function updateDateTime() {

    const dateElement =
        document.getElementById(
            "currentDate"
        );

    const timeElement =
        document.getElementById(
            "currentTime"
        );


    if (!dateElement || !timeElement) {
        return;
    }


    const now = new Date();


    const formattedDate =
        now.toLocaleDateString(
            "en-US",
            {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );


    const formattedTime =
        now.toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            }
        );


    dateElement.textContent =
        formattedDate;


    timeElement.textContent =
        formattedTime;

}


// =========================
// QUICK ACCESS
// =========================

function setupQuickAccess() {

    const button =
        document.getElementById(
            "quickAccessBtn"
        );

    const menu =
        document.getElementById(
            "quickAccessMenu"
        );


    if (!button || !menu) {
        return;
    }


    // =========================
    // OPEN / CLOSE MENU
    // =========================

    button.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            const isOpen =
                menu.classList.contains(
                    "show"
                );


            closeTopbarMenus();


            if (!isOpen) {

                menu.classList.add(
                    "show"
                );

                button.classList.add(
                    "active"
                );

            }

        }
    );


    // =========================
    // NEW TRANSACTION
    // =========================

    const newTransactionButton =
        document.getElementById(
            "quickNewTransaction"
        );


    if (newTransactionButton) {

        newTransactionButton.addEventListener(
            "click",
            function () {

                closeTopbarMenus();

                openNewTransaction();

            }
        );

    }


    // =========================
    // NEW PURCHASE ORDER
    // =========================

    const newPurchaseOrderButton =
        document.getElementById(
            "quickNewPurchaseOrder"
        );


    if (newPurchaseOrderButton) {

        newPurchaseOrderButton.addEventListener(
            "click",
            function () {

                closeTopbarMenus();

                openNewPurchaseOrder();

            }
        );

    }


    // =========================
    // STOCK IN
    // =========================

    const stockInButton =
        document.getElementById(
            "quickStockIn"
        );


    if (stockInButton) {

        stockInButton.addEventListener(
            "click",
            function () {

                closeTopbarMenus();

                console.log(
                    "Stock In selected"
                );

            }
        );

    }


    // =========================
    // STOCK OUT
    // =========================

    const stockOutButton =
        document.getElementById(
            "quickStockOut"
        );


    if (stockOutButton) {

        stockOutButton.addEventListener(
            "click",
            function () {

                closeTopbarMenus();

                console.log(
                    "Stock Out selected"
                );

            }
        );

    }


    // =========================
    // ADD PRODUCT
    // =========================

    const addProductButton =
        document.getElementById(
            "quickAddProduct"
        );


    if (addProductButton) {

        addProductButton.addEventListener(
            "click",
            function () {

                closeTopbarMenus();

                console.log(
                    "Add Product selected"
                );

            }
        );

    }

}


// =========================
// OPEN NEW TRANSACTION
// =========================

function openNewTransaction() {

    const existingModal =
        document.getElementById(
            "transactionOverlay"
        );


    // Modal already exists
    if (existingModal) {

        if (
            typeof initializeTransactionModal ===
            "function"
        ) {

            initializeTransactionModal();

        }

        return;

    }


    // Load modal HTML
    fetch("new-transaction.html")

        .then(function (response) {

            if (!response.ok) {

                throw new Error(
                    "Could not load new-transaction.html"
                );

            }

            return response.text();

        })

        .then(function (html) {

            document.body.insertAdjacentHTML(
                "beforeend",
                html
            );


            // Check if JS is already loaded
            const existingScript =
                document.getElementById(
                    "newTransactionScript"
                );


            if (existingScript) {

                if (
                    typeof initializeTransactionModal ===
                    "function"
                ) {

                    initializeTransactionModal();

                }

                return;

            }


            // Load JS
            const script =
                document.createElement(
                    "script"
                );


            script.id =
                "newTransactionScript";


            script.src =
                "new-transaction.js";


            script.onload =
                function () {

                    if (
                        typeof initializeTransactionModal ===
                        "function"
                    ) {

                        initializeTransactionModal();

                    }

                };


            script.onerror =
                function () {

                    console.error(
                        "Could not load new-transaction.js"
                    );

                };


            document.body.appendChild(
                script
            );

        })

        .catch(function (error) {

            console.error(
                "New Transaction error:",
                error
            );

        });

}


// =========================
// OPEN NEW PURCHASE ORDER
// =========================

function openNewPurchaseOrder() {

    const existingModal =
        document.getElementById(
            "purchaseOrderOverlay"
        );


    // Modal already exists
    if (existingModal) {

        if (
            typeof openPurchaseOrderModal ===
            "function"
        ) {

            openPurchaseOrderModal();

        } else {

            existingModal.classList.add(
                "show"
            );

        }

        return;

    }


    // Load Purchase Order HTML
    fetch("new-purchase-order.html")

        .then(function (response) {

            if (!response.ok) {

                throw new Error(
                    "Could not load new-purchase-order.html"
                );

            }

            return response.text();

        })

        .then(function (html) {

            // Insert modal
            document.body.insertAdjacentHTML(
                "beforeend",
                html
            );


            // Check if script already exists
            const existingScript =
                document.getElementById(
                    "newPurchaseOrderScript"
                );


            if (existingScript) {

                if (
                    typeof initializePurchaseOrderModal ===
                    "function"
                ) {

                    initializePurchaseOrderModal();

                }


                if (
                    typeof openPurchaseOrderModal ===
                    "function"
                ) {

                    openPurchaseOrderModal();

                }

                return;

            }


            // Create script
            const script =
                document.createElement(
                    "script"
                );


            script.id =
                "newPurchaseOrderScript";


            script.src =
                "new-purchase-order.js";


            script.onload =
                function () {

                    if (
                        typeof initializePurchaseOrderModal ===
                        "function"
                    ) {

                        initializePurchaseOrderModal();

                    }


                    if (
                        typeof openPurchaseOrderModal ===
                        "function"
                    ) {

                        openPurchaseOrderModal();

                    }

                };


            script.onerror =
                function () {

                    console.error(
                        "Could not load new-purchase-order.js"
                    );

                };


            document.body.appendChild(
                script
            );

        })

        .catch(function (error) {

            console.error(
                "New Purchase Order error:",
                error
            );

        });

}


// =========================
// NOTIFICATIONS
// =========================

function setupNotifications() {

    const button =
        document.getElementById(
            "notificationBtn"
        );

    const menu =
        document.getElementById(
            "notificationMenu"
        );


    if (!button || !menu) {
        return;
    }


    // =========================
    // OPEN / CLOSE
    // =========================

    button.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            const isOpen =
                menu.classList.contains(
                    "show"
                );


            closeTopbarMenus();


            if (!isOpen) {

                menu.classList.add(
                    "show"
                );

                button.classList.add(
                    "active"
                );

            }

        }
    );


    // =========================
    // MARK ALL AS READ
    // =========================

    const markAllReadButton =
        document.getElementById(
            "markAllReadBtn"
        );


    if (markAllReadButton) {

        markAllReadButton.addEventListener(
            "click",
            function () {

                const unreadNotifications =
                    document.querySelectorAll(
                        ".notification-item.unread"
                    );


                unreadNotifications.forEach(
                    function (notification) {

                        notification.classList.remove(
                            "unread"
                        );

                    }
                );


                updateNotificationBadge();

            }
        );

    }

}


// =========================
// NOTIFICATION BADGE
// =========================

function updateNotificationBadge() {

    const badge =
        document.getElementById(
            "notificationBadge"
        );


    if (!badge) {
        return;
    }


    const unreadNotifications =
        document.querySelectorAll(
            ".notification-item.unread"
        );


    const unreadCount =
        unreadNotifications.length;


    if (unreadCount === 0) {

        badge.textContent = "";

        badge.classList.remove(
            "show"
        );

        return;

    }


    badge.classList.add(
        "show"
    );


    if (unreadCount > 99) {

        badge.textContent =
            "99+";

    } else {

        badge.textContent =
            unreadCount;

    }

}


// =========================
// CLOSE TOPBAR MENUS
// =========================

function closeTopbarMenus() {

    const quickMenu =
        document.getElementById(
            "quickAccessMenu"
        );


    const notificationMenu =
        document.getElementById(
            "notificationMenu"
        );


    const quickButton =
        document.getElementById(
            "quickAccessBtn"
        );


    const notificationButton =
        document.getElementById(
            "notificationBtn"
        );


    if (quickMenu) {

        quickMenu.classList.remove(
            "show"
        );

    }


    if (notificationMenu) {

        notificationMenu.classList.remove(
            "show"
        );

    }


    if (quickButton) {

        quickButton.classList.remove(
            "active"
        );

    }


    if (notificationButton) {

        notificationButton.classList.remove(
            "active"
        );

    }

}


// =========================
// CLICK OUTSIDE
// =========================

document.addEventListener(
    "click",
    function (event) {

        const clickedInsideQuickAccess =
            event.target.closest(
                ".quick-access"
            );


        const clickedInsideNotifications =
            event.target.closest(
                ".notifications"
            );


        if (
            !clickedInsideQuickAccess &&
            !clickedInsideNotifications
        ) {

            closeTopbarMenus();

        }

    }
);


// =========================
// ESCAPE KEY
// =========================

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {
            return;
        }


        // =========================
        // PURCHASE ORDER
        // =========================

        const purchaseOrderModal =
            document.getElementById(
                "purchaseOrderOverlay"
            );


        if (
            purchaseOrderModal &&
            purchaseOrderModal.classList.contains(
                "show"
            )
        ) {

            if (
                typeof closePurchaseOrderModal ===
                "function"
            ) {

                closePurchaseOrderModal();

            } else {

                purchaseOrderModal.classList.remove(
                    "show"
                );

            }

            return;

        }


        // =========================
        // NEW TRANSACTION
        // =========================

        const transactionModal =
            document.getElementById(
                "transactionOverlay"
            );


        if (transactionModal) {

            if (
                typeof closeTransactionModal ===
                "function"
            ) {

                closeTransactionModal();

            } else {

                transactionModal.remove();

            }

            return;

        }


        // =========================
        // TOPBAR MENUS
        // =========================

        closeTopbarMenus();

    }
);