document.addEventListener("DOMContentLoaded", function () {

    var menuBtn = document.getElementById("menuBtn");
    var toc = document.getElementById("toc");
    var tocLinks = toc ? Array.prototype.slice.call(toc.querySelectorAll("a")) : [];
    var sections = tocLinks
        .map(function (link) {
            var id = link.getAttribute("href").replace("#", "");
            return document.getElementById(id);
        })
        .filter(Boolean);


    /* =========================
       MOBILE "SECTIONS" TOGGLE
    ========================= */

    if (menuBtn && toc) {

        menuBtn.addEventListener("click", function () {

            var isOpen = toc.classList.toggle("open");

            menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
            menuBtn.textContent = isOpen ? "Close" : "Sections";

        });

        // Close the mobile TOC after a section link is tapped
        tocLinks.forEach(function (link) {

            link.addEventListener("click", function () {

                if (window.matchMedia("(max-width: 900px)").matches) {

                    toc.classList.remove("open");

                    menuBtn.setAttribute("aria-expanded", "false");
                    menuBtn.textContent = "Sections";

                }

            });

        });

    }


    /* =========================
       SCROLL-SPY ACTIVE LINK
    ========================= */

    if (sections.length && tocLinks.length && "IntersectionObserver" in window) {

        var setActive = function (id) {

            tocLinks.forEach(function (link) {

                var match = link.getAttribute("href") === "#" + id;

                link.classList.toggle("active", match);

            });

        };

        var observer = new IntersectionObserver(
            function (entries) {

                entries.forEach(function (entry) {

                    if (entry.isIntersecting) {

                        setActive(entry.target.id);

                    }

                });

            },
            {
                rootMargin: "-110px 0px -70% 0px",
                threshold: 0
            }
        );

        sections.forEach(function (section) {

            observer.observe(section);

        });

    }

});