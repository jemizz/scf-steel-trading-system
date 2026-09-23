fetch("navbar.html")
    .then(response => response.text())
    .then(data => {

        document.getElementById("navbar").innerHTML = data;

        const currentPage = window.location.pathname.split("/").pop();

        const navLinks = document.querySelectorAll(".nav-links a");

        navLinks.forEach(link => {

            const linkPage = link.getAttribute("href");

            if (linkPage === currentPage) {
                link.classList.add("active");
            }

        });

    })
    .catch(error => {
        console.error("Error loading navbar:", error);
    });