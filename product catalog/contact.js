// =========================
// SCF STEEL TRADING
// CONTACT PAGE DATA
// =========================

(() => {
    "use strict";

    const PUBLIC_CONTACT_API =
        "../admin dashboard/settings.php?action=get_public_contact";

    function formatPhone(phone) {
        if (!phone) return "";

        const digits = String(phone).replace(/\D/g, "");

        if (digits.length === 11 && digits.startsWith("09")) {
            return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
        }

        return phone;
    }

    function loadContactInformation() {
        fetch(PUBLIC_CONTACT_API, {
            method: "GET",
            cache: "no-store"
        })
            .then(async (response) => {
                const data = await response.json().catch(() => ({}));

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message ||
                        "Unable to load contact information."
                    );
                }

                return data.contact || {};
            })
            .then((contact) => {

                const phoneElement =
                    document.getElementById("contactPhone");

                const emailElement =
                    document.getElementById("contactEmail");

                if (phoneElement) {
                    phoneElement.textContent =
                        formatPhone(contact.contact_no) ||
                        "Not available";
                }

                if (emailElement) {
                    emailElement.textContent =
                        contact.email ||
                        "Not available";
                }

            })
            .catch((error) => {
                console.error(
                    "Contact information error:",
                    error
                );

                const phoneElement =
                    document.getElementById("contactPhone");

                const emailElement =
                    document.getElementById("contactEmail");

                if (phoneElement) {
                    phoneElement.textContent =
                        "Not available";
                }

                if (emailElement) {
                    emailElement.textContent =
                        "Not available";
                }
            });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            loadContactInformation,
            { once: true }
        );
    } else {
        loadContactInformation();
    }
})();