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
                throw new Error("Could not load topbar.html");
            }

            return response.text();

        })

        .then(function (html) {

            topbarContainer.innerHTML = html;


            // Set current page title
            setTopbarTitle(pageTitle);


            // Start date and time
            updateDateTime();

            setInterval(updateDateTime, 1000);


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
        document.getElementById("topbarPageTitle");


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
        document.getElementById("currentDate");

    const timeElement =
        document.getElementById("currentTime");


    if (!dateElement || !timeElement) {
        return;
    }


    const now = new Date();


    const formattedDate =
        now.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });


    const formattedTime =
        now.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });


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
        document.getElementById("quickAccessBtn");

    const menu =
        document.getElementById("quickAccessMenu");


    if (!button || !menu) {
        return;
    }


    // OPEN / CLOSE QUICK ACCESS MENU
    button.addEventListener("click", function (event) {

        event.stopPropagation();


        const isOpen =
            menu.classList.contains("show");


        closeTopbarMenus();


        if (!isOpen) {

            menu.classList.add("show");

            button.classList.add("active");

        }

    });


    // =========================
    // NEW TRANSACTION
    // =========================

    const newTransactionButton =
        document.getElementById("quickNewTransaction");


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
    // STOCK IN
    // =========================

    const stockInButton =
        document.getElementById("quickStockIn");


    if (stockInButton) {

        stockInButton.addEventListener(
            "click",
            function () {

                closeTopbarMenus();


                /*
                    We will connect this to the
                    Stock In modal later.
                */

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
        document.getElementById("quickStockOut");


    if (stockOutButton) {

        stockOutButton.addEventListener(
            "click",
            function () {

                closeTopbarMenus();


                /*
                    We will connect this to the
                    Stock Out modal later.
                */

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
        document.getElementById("quickAddProduct");


    if (addProductButton) {

        addProductButton.addEventListener(
            "click",
            function () {

                closeTopbarMenus();


                /*
                    We will connect this to the
                    Add Product modal later.
                */

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

    /*
        Prevent the transaction modal
        from opening more than once.
    */

    const existingModal =
        document.getElementById(
            "transactionOverlay"
        );


    if (existingModal) {
        return;
    }


    /*
        Load the transaction modal HTML.
    */

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

            /*
                Add the modal HTML at the
                end of the current page.
            */

            document.body.insertAdjacentHTML(
                "beforeend",
                html
            );


            /*
                Check if new-transaction.js
                was already loaded before.
            */

            const existingScript =
                document.getElementById(
                    "newTransactionScript"
                );


            if (existingScript) {

                /*
                    JS already exists,
                    just initialize the modal.
                */

                if (
                    typeof initializeTransactionModal ===
                    "function"
                ) {

                    initializeTransactionModal();

                }


                return;

            }


            /*
                Load new-transaction.js.
            */

            const script =
                document.createElement("script");


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


    // OPEN / CLOSE NOTIFICATION MENU
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


    // MARK ALL AS READ
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


    // NO UNREAD NOTIFICATIONS
    if (unreadCount === 0) {

        badge.textContent = "";

        badge.classList.remove(
            "show"
        );

        return;

    }


    // SHOW BADGE
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


        /*
            If New Transaction is open,
            close the transaction first.
        */

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


        /*
            Otherwise close topbar menus.
        */

        closeTopbarMenus();

    }
);