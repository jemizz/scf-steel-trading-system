// =========================
// LOAD SIDEBAR
// =========================

fetch("sidebar.html?v=2")
    .then(response => {

        if (!response.ok) {
            throw new Error("Could not load sidebar.");
        }

        return response.text();
    })

    .then(data => {

        const sidebarContainer =
            document.getElementById("sidebar");

        if (!sidebarContainer) {
            return;
        }

        // Insert sidebar
        sidebarContainer.innerHTML = data;


        // =========================
        // ACTIVE PAGE
        // =========================

        const currentPage =
            window.location.pathname.split("/").pop();

        const links =
            document.querySelectorAll(".sidebar-link");

        links.forEach(link => {

            const linkPage =
                link.getAttribute("href");

            if (linkPage === currentPage) {
                link.classList.add("active");
            }

        });


        // =========================
        // LOG OUT
        // =========================

        const logoutBtn =
            document.getElementById("logoutBtn");

        if (logoutBtn) {

            logoutBtn.addEventListener("click", function (event) {

                event.preventDefault();

                // Redirect to admin login page
                window.location.href = "login.html";

            });

        }

    })

    .catch(error => {

        console.error(
            "Sidebar error:",
            error
        );

    });