// =========================
// LOAD SIDEBAR
// =========================

fetch("sidebar.html?v=4", {
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