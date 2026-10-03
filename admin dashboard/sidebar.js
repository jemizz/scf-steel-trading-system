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

// =========================
// SMOOTH TOGGLE (FLIP technique)
//
// The layout (margin-left etc.) changes ONCE, instantly. Then every
// moved element is animated with `transform` only, from where it
// visually was to where it is now. Transforms run on the GPU, so
// there is no per-frame layout work: no lag, no gaps, no desync,
// and clicking fast simply reverses the motion from wherever it is.
// =========================

const SIDEBAR_ANIM_MS = 260;
const SIDEBAR_ANIM_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

// Elements that move when the sidebar toggles
const SIDEBAR_MOVING_SELECTOR =
    ".sidebar, .admin-content, .products-main, [data-sidebar-offset]";

let sidebarAnimToken = 0;

function getMovingElements() {

    // top-level only: children move together with their parent
    return Array.from(
        document.querySelectorAll(SIDEBAR_MOVING_SELECTOR)
    ).filter(el => {
        const parent = el.parentElement;
        return !(parent && parent.closest(SIDEBAR_MOVING_SELECTOR));
    });

}

function setSidebarCollapsed(collapsed) {

    const root = document.documentElement;

    if (root.classList.contains("sidebar-collapsed") === collapsed) {
        return;
    }

    const reduceMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const elements = reduceMotion ? [] : getMovingElements();
    const token = ++sidebarAnimToken;

    // 1. FIRST - where each element is right now
    //    (includes any animation that is still running)
    const first = elements.map(el => el.getBoundingClientRect().left);

    // stop running animations, so the layout position can be read
    elements.forEach(el => {
        el.style.transition = "none";
        el.style.transform = "";
    });

    // 2. change the real layout (instant)
    root.classList.toggle("sidebar-collapsed", collapsed);

    try {
        localStorage.setItem(
            SIDEBAR_STORAGE_KEY,
            collapsed ? "1" : "0"
        );
    } catch (e) {
        // ignore
    }

    if (!elements.length) {
        return;
    }

    // 3. LAST + INVERT - jump back to the old visual position
    const moving = [];

    elements.forEach((el, i) => {

        const last = el.getBoundingClientRect().left;
        const delta = first[i] - last;

        if (Math.abs(delta) < 0.5) {
            return;
        }

        // the element's own transform (e.g. the hidden sidebar)
        const cs = getComputedStyle(el).transform;
        const baseX =
            cs && cs !== "none" ? new DOMMatrix(cs).m41 : 0;

        el.style.willChange = "transform";
        el.style.transform = `translateX(${delta + baseX}px)`;

        moving.push(el);

    });

    if (!moving.length) {
        return;
    }

    root.classList.add("sidebar-animating");

    void document.body.offsetWidth; // force reflow

    // 4. PLAY - animate to the final position
    moving.forEach(el => {
        el.style.transition =
            `transform ${SIDEBAR_ANIM_MS}ms ${SIDEBAR_ANIM_EASE}`;
        el.style.transform = "";
    });

    setTimeout(function () {

        if (token !== sidebarAnimToken) {
            return; // a newer toggle took over
        }

        moving.forEach(el => {
            el.style.transition = "";
            el.style.willChange = "";
        });

        root.classList.remove("sidebar-animating");

    }, SIDEBAR_ANIM_MS + 30);

}


// =========================
// "SHOW SIDEBAR" BUTTON (lives inside the topbar)
// The button is in topbar.html (#sidebarOpenBtn). Event delegation
// is used because the topbar is loaded later via fetch.
// It is visible only while the sidebar is hidden (see CSS).
// Because it is part of the topbar, it scrolls away with it.
// =========================

document.addEventListener("click", function (event) {

    if (event.target.closest(".sidebar-open-btn")) {
        setSidebarCollapsed(false);
    }

});


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
            el.closest(".sidebar")
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