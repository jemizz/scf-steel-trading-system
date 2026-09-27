(() => {
  const basePath = new URL(".", document.currentScript.src);

  let modal;
  let loading;
  let previousOverflow = "";
  let previousButton;

  // OPEN from button
  document.addEventListener("click", (event) => {
    const button = event.target.closest("#addSupplierBtn");
    if (!button) return;

    event.preventDefault();
    openModal(button);
  });

  async function loadModal() {
    // Load CSS once (like add-product.js)
    if (!document.querySelector('link[data-as-css="1"]')) {
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = new URL("add-suppliers.css", basePath);
      stylesheet.dataset.asCss = "1";
      document.head.appendChild(stylesheet);
    }

    // Fetch modal HTML (dialog snippet)
    const response = await fetch(new URL("add-suppliers.html", basePath));
    if (!response.ok) throw new Error("Could not load add-suppliers.html.");

    const html = await response.text();

    document.body.insertAdjacentHTML("beforeend", html);
    modal = document.getElementById("addSupplierModal");

    if (!modal) throw new Error("addSupplierModal not found in add-suppliers.html.");

    // Close buttons
    modal.querySelectorAll("[data-as-close]").forEach(btn => {
      btn.addEventListener("click", closeModal);
    });

    // ESC key (prevent default so we can restore focus/overflow properly)
    modal.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeModal();
    });

    // Restore state on close
    modal.addEventListener("close", () => {
      document.body.style.overflow = previousOverflow;
      previousButton?.focus();
    });

    // Close when clicking backdrop (outside content)
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });

    // Update selected count
    modal.addEventListener("change", (event) => {
      if (event.target.matches('input[name="products"]')) {
        updateSelectedCount();
      }
    });

    // Submit
    modal.querySelector("#asForm").addEventListener("submit", (event) => {
      event.preventDefault();

      // demo: collect data
      const fd = new FormData(event.target);
      const products = [...modal.querySelectorAll('input[name="products"]:checked')]
        .map(cb => cb.value);

      const payload = {
        businessName: (fd.get("businessName") || "").toString().trim(),
        contactPerson: (fd.get("contactPerson") || "").toString().trim(),
        phone: (fd.get("phone") || "").toString().trim(),
        email: (fd.get("email") || "").toString().trim(),
        paymentTerms: (fd.get("paymentTerms") || "").toString(),
        address: (fd.get("address") || "").toString().trim(),
        products
      };

      // Basic required check
      if (!payload.businessName) {
        showError("Business name is required.");
        return;
      }

      showError("");
      window.dispatchEvent(new CustomEvent("supplier:added", { detail: payload }));

      closeModal();
    });
  }

  async function openModal(button) {
    try {
      if (!modal) {
        if (!loading) {
          loading = loadModal().catch(err => {
            loading = null;
            throw err;
          });
        }
        await loading;
      }

      if (modal.open) return;

      previousButton = button;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // reset
      modal.querySelector("#asForm").reset();
      showError("");
      updateSelectedCount();

      modal.showModal();
      modal.querySelector('[name="businessName"]')?.focus();
    } catch (error) {
      alert(error.message);
    }
  }

  function closeModal() {
    modal?.close();
  }

  function updateSelectedCount() {
    const count = modal.querySelectorAll('input[name="products"]:checked').length;
    const el = modal.querySelector("#asSelectedCount");
    if (el) el.textContent = `${count} selected`;
  }

  function showError(message) {
    const error = modal.querySelector("#asError");
    error.textContent = message;
    error.hidden = !message;
  }
})();