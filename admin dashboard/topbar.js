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


            // Start topbar features
            updateDateTime();

            setInterval(updateDateTime, 1000);


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


    // STOCK IN
    const stockInButton =
        document.getElementById("quickStockIn");


    if (stockInButton) {

        stockInButton.addEventListener("click", function () {

            closeTopbarMenus();


            /*
                We will connect this to the
                Stock In modal later.
            */

            console.log("Stock In selected");

        });

    }


    // STOCK OUT
    const stockOutButton =
        document.getElementById("quickStockOut");


    if (stockOutButton) {

        stockOutButton.addEventListener("click", function () {

            closeTopbarMenus();


            /*
                We will connect this to the
                Stock Out modal later.
            */

            console.log("Stock Out selected");

        });

    }


    // ADD PRODUCT
    const addProductButton =
        document.getElementById("quickAddProduct");


    if (addProductButton) {

        addProductButton.addEventListener("click", function () {

            closeTopbarMenus();


            /*
                We will connect this to the
                Add Product form/modal later.
            */

            console.log("Add Product selected");

        });

    }

}


// =========================
// NOTIFICATIONS
// =========================

function setupNotifications() {

    const button =
        document.getElementById("notificationBtn");

    const menu =
        document.getElementById("notificationMenu");


    if (!button || !menu) {
        return;
    }


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


    const markAllReadButton =
        document.getElementById("markAllReadBtn");


    if (markAllReadButton) {

        markAllReadButton.addEventListener("click", function () {

            const unreadNotifications =
                document.querySelectorAll(
                    ".notification-item.unread"
                );


            unreadNotifications.forEach(function (notification) {

                notification.classList.remove("unread");

            });


            updateNotificationBadge();

        });

    }

}


// =========================
// NOTIFICATION BADGE
// =========================

function updateNotificationBadge() {

    const badge =
        document.getElementById("notificationBadge");


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

        badge.classList.remove("show");

        return;

    }


    badge.classList.add("show");


    if (unreadCount > 99) {

        badge.textContent = "99+";

    } else {

        badge.textContent = unreadCount;

    }

}


// =========================
// CLOSE MENUS
// =========================

function closeTopbarMenus() {

    const quickMenu =
        document.getElementById("quickAccessMenu");

    const notificationMenu =
        document.getElementById("notificationMenu");

    const quickButton =
        document.getElementById("quickAccessBtn");

    const notificationButton =
        document.getElementById("notificationBtn");


    if (quickMenu) {

        quickMenu.classList.remove("show");

    }


    if (notificationMenu) {

        notificationMenu.classList.remove("show");

    }


    if (quickButton) {

        quickButton.classList.remove("active");

    }


    if (notificationButton) {

        notificationButton.classList.remove("active");

    }

}


// =========================
// CLICK OUTSIDE
// =========================

document.addEventListener("click", function (event) {

    const clickedInsideQuickAccess =
        event.target.closest(".quick-access");


    const clickedInsideNotifications =
        event.target.closest(".notifications");


    if (
        !clickedInsideQuickAccess &&
        !clickedInsideNotifications
    ) {

        closeTopbarMenus();

    }

});


// =========================
// ESCAPE KEY
// =========================

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        closeTopbarMenus();

    }

});