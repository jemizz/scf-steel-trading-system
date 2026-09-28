(() => {
    "use strict";

    const CONTACT_API =
        "../admin dashboard/settings.php?action=get_public_contact";

    function formatPhone(phone) {
        if (!phone) return "";

        const digits = String(phone).replace(/\D/g, "");

        if (digits.length === 11 && digits.startsWith("09")) {
            return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
        }

        return phone;
    }

    // =========================
    // LOAD FOOTER HTML
    // =========================

    fetch("footer.html")
        .then(response => {
            if (!response.ok) {
                throw new Error("Unable to load footer.html");
            }

            return response.text();
        })
        .then(data => {

            const footerContainer =
                document.getElementById("footer");

            if (!footerContainer) {
                throw new Error(
                    'Element with id="footer" was not found.'
                );
            }

            footerContainer.innerHTML = data;

            // After footer HTML is loaded,
            // load the latest contact information.
            return loadContactInformation();
        })
        .catch(error => {
            console.error(
                "Error loading footer:",
                error
            );
        });


    // =========================
    // LOAD CONTACT INFORMATION
    // =========================

    function loadContactInformation() {

        return fetch(CONTACT_API, {
            method: "GET",
            cache: "no-store"
        })
            .then(async response => {

                const data =
                    await response.json().catch(() => ({}));

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message ||
                        "Unable to load contact information."
                    );
                }

                return data.contact || {};
            })
            .then(contact => {

                const phone =
                    document.querySelector(
                        "[data-footer-phone]"
                    );

                const email =
                    document.querySelector(
                        "[data-footer-email]"
                    );

                const facebook =
                    document.querySelector(
                        "[data-footer-facebook]"
                    );


                // Phone
                if (phone) {
                    phone.textContent =
                        formatPhone(
                            contact.contact_no
                        ) || "Not available";
                }


                // Email
                if (email) {
                    email.textContent =
                        contact.email ||
                        "Not available";
                }


                // Facebook
                if (facebook) {

                    const facebookUrl =
                        contact.links || "";

                    if (facebookUrl) {

                        facebook.href =
                            facebookUrl;

                        facebook.target =
                            "_blank";

                        facebook.rel =
                            "noopener noreferrer";

                        facebook.textContent =
                            "SCF Steel Trading";

                    } else {

                        facebook.removeAttribute(
                            "href"
                        );

                        facebook.removeAttribute(
                            "target"
                        );

                        facebook.textContent =
                            "SCF Steel Trading";
                    }
                }

            })
            .catch(error => {

                console.error(
                    "Error loading contact information:",
                    error
                );

            });
    }

})();