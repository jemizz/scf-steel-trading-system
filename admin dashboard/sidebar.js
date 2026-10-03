// =========================
// SIDEBAR COLLAPSE (STATE)
// Applied immediately so there is no flicker on page load
// =========================

const SIDEBAR_STORAGE_KEY = "sidebarCollapsed";

try {
    if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1") {
        document.documentElement.classList.add("sidebar-collapsed");
    }
} catch (e) {
    // localStorage unavailable - ignore
}

function setSidebarCollapsed(collapsed) {

    document.documentElement.classList.toggle(
        "sidebar-collapsed",
        collapsed
    );

    try {
        localStorage.setItem(
            SIDEBAR_STORAGE_KEY,
            collapsed ? "1" : "0"
        );
    } catch (e) {
        // ignore
    }

}


// =========================
// FLOATING "SHOW SIDEBAR" BUTTON
// (visible only when the sidebar is hidden)
// =========================

function createOpenButton() {

    if (document.querySelector(".sidebar-open-btn")) {
        return;
    }

    const openBtn = document.createElement("button");

    openBtn.type = "button";
    openBtn.className = "sidebar-open-btn";
    openBtn.title = "Show sidebar";
    openBtn.setAttribute("aria-label", "Show sidebar");

    openBtn.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="4.5" width="20" height="15" rx="3"></rect>
            <path d="M8 4.5v15"></path>
            <path d="M16 8.8 12.8 12l3.2 3.2"></path>
        </svg>
    `;

    openBtn.addEventListener("click", function () {
        setSidebarCollapsed(false);
    });

    document.body.appendChild(openBtn);

}

if (document.body) {
    createOpenButton();
} else {
    document.addEventListener("DOMContentLoaded", createOpenButton);
}


// =========================
// AUTO-DETECT ELEMENTS OFFSET BY THE SIDEBAR
// Finds any element pushed right by the sidebar width
// (margin-left / left / padding-left / fixed width) and
// tags it so the CSS can reset it when the sidebar is hidden.
// =========================

function markSidebarOffsets() {

    if (!document.body) {
        return;
    }

    const sidebarWidth = window.innerWidth <= 800 ? 200 : 230;

    const near = value =>
        Math.abs(parseFloat(value) - sidebarWidth) <= 1;

    document.body.querySelectorAll("*").forEach(el => {

        if (
            el.hasAttribute("data-sidebar-offset") ||
            el.closest("#sidebar") ||
            el.closest(".sidebar") ||
            el.classList.contains("sidebar-open-btn")
        ) {
            return;
        }

        const cs = getComputedStyle(el);
        const tokens = [];

        if (near(cs.marginLeft)) {
            tokens.push("margin");
        }

        if (cs.position !== "static" && near(cs.left)) {
            tokens.push("left");
        }

        if (
            near(cs.paddingLeft) &&
            el.offsetWidth > window.innerWidth * 0.5
        ) {
            tokens.push("padding");
        }

        if (
            cs.position === "fixed" &&
            Math.abs(
                el.offsetWidth - (window.innerWidth - sidebarWidth)
            ) <= 1
        ) {
            tokens.push("width");
        }

        if (tokens.length) {
            el.setAttribute("data-sidebar-offset", tokens.join(" "));
        }

    });

}

document.addEventListener("DOMContentLoaded", markSidebarOffsets);
window.addEventListener("load", markSidebarOffsets);
setTimeout(markSidebarOffsets, 600);


// =========================
// LOAD SIDEBAR
// =========================

fetch("sidebar.html?v=6", {
    cache: "no-store"
})
    .then(response => {

        if (!response.ok) {
            throw new Error(
                "Could not load sidebar."
            );
        }

        return response.text();

    })

    .then(data => {

        const sidebarContainer =
            document.getElementById("sidebar");

        if (!sidebarContainer) {
            return;
        }


        // =========================
        // INSERT SIDEBAR
        // =========================

        sidebarContainer.innerHTML = data;


        // =========================
        // HIDE SIDEBAR BUTTON
        // =========================

        const closeBtn =
            sidebarContainer.querySelector(
                "#sidebarCloseBtn"
            );

        if (closeBtn) {

            closeBtn.addEventListener(
                "click",
                function () {
                    setSidebarCollapsed(true);
                }
            );

        }


        // =========================
        // LOAD ADMIN USERNAME
        // =========================

        loadSidebarAdmin(sidebarContainer);


        // =========================
        // ACTIVE PAGE
        // =========================

        const currentPage =
            window.location.pathname
                .split("/")
                .pop();

        const links =
            sidebarContainer.querySelectorAll(
                ".sidebar-link"
            );

        links.forEach(link => {

            const linkPage =
                link.getAttribute("href");

            if (linkPage === currentPage) {
                link.classList.add("active");
            }

        });


        // =========================
        // PREVENT PAGE SCROLL
        // WHILE HOVERING SIDEBAR
        // =========================

        const sidebar =
            sidebarContainer.querySelector(
                ".sidebar"
            );

        const nav =
            sidebarContainer.querySelector(
                ".sidebar-nav"
            );

        if (sidebar && nav) {

            sidebar.addEventListener(
                "wheel",
                function (event) {

                    if (
                        nav.scrollHeight <=
                        nav.clientHeight
                    ) {
                        event.preventDefault();
                    }

                },
                {
                    passive: false
                }
            );

        }


        // =========================
        // LOG OUT
        // =========================

        const logoutBtn =
            sidebarContainer.querySelector(
                "#logoutBtn"
            );

        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.location.href =
                        "login.html";

                }
            );

        }

    })

    .catch(error => {

        console.error(
            "Sidebar error:",
            error
        );

    });


// =========================
// LOAD SIDEBAR ADMIN
// =========================

async function loadSidebarAdmin(sidebarContainer) {

    const usernameElement =
        sidebarContainer.querySelector(
            "#sidebarAdminUsername"
        );

    if (!usernameElement) {

        console.error(
            "sidebarAdminUsername element not found."
        );

        return;
    }

    try {

        const response = await fetch(
            "settings.php?action=get_sidebar_admin",
            {
                method: "GET",
                cache: "no-store",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const data = await response.json();


        console.log(
            "SIDEBAR DATA:",
            data
        );


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load administrator."
            );

        }


        if (!data.username) {

            throw new Error(
                "Username is empty."
            );

        }


        // =========================
        // DISPLAY USERNAME
        // =========================

        usernameElement.textContent =
            data.username;


        console.log(
            "USERNAME DISPLAYED:",
            data.username
        );

    }

    catch (error) {

        console.error(
            "Sidebar username error:",
            error
        );

        usernameElement.textContent =
            "Administrator";

    }

}