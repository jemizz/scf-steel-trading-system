// =========================
// SCF STEEL TRADING
// CONTACT PAGE
// =========================

(() => {
    "use strict";

    const PUBLIC_CONTACT_API =
        "../admin dashboard/settings.php?action=get_public_contact";

    // =========================
    // FORMAT DISPLAYED PHONE
    // =========================

    function formatPhone(phone) {
        if (!phone) return "";

        const digits = String(phone).replace(/\D/g, "");

        if (digits.length === 11 && digits.startsWith("09")) {
            return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
        }

        return phone;
    }

    // =========================
    // CONTACT NUMBER VALIDATION
    // =========================

   function setupContactValidation() {
    const contactInput = document.getElementById("contact");

    if (!contactInput) return;

    contactInput.setAttribute("inputmode", "numeric");
    contactInput.setAttribute("maxlength", "11");
    contactInput.setAttribute("pattern", "[0-9]{11}");
    contactInput.setAttribute("title", "Enter exactly 11 digits.");

    contactInput.addEventListener("input", function () {
        this.value = this.value.replace(/[^0-9]/g, "").slice(0, 11);
    });
}

    // =========================
    // LOAD CONTACT INFORMATION
    // =========================

    function loadContactInformation() {
        fetch(PUBLIC_CONTACT_API, {
            method: "GET",
            cache: "no-store"
        })
            .then(async (response) => {
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

    // =========================
    // INITIALIZE PAGE
    // =========================

    function initializeContactPage() {
        setupContactValidation();
        loadContactInformation();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeContactPage,
            { once: true }
        );
    } else {
        initializeContactPage();
    }
})();