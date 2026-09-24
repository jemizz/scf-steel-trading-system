fetch("sidebar.html?v=2")
    .then(response => {
        if (!response.ok) {
            throw new Error("Could not load sidebar.");
        }

        return response.text();
    })
    .then(data => {
        document.getElementById("sidebar").innerHTML = data;

        const currentPage =
            window.location.pathname.split("/").pop();

        const links =
            document.querySelectorAll(".sidebar-link");

        links.forEach(link => {
            if (link.getAttribute("href") === currentPage) {
                link.classList.add("active");
            }
        });
    })
    .catch(error => {
        console.error(error);
    });