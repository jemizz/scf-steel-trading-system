(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    // =========================
    // ELEMENTS
    // =========================
    const pillGroup = document.querySelector(".pill-group");
    const pills = () => Array.from(document.querySelectorAll(".pill-group .pill"));
    const cards = () => Array.from(document.querySelectorAll(".products .grid .card"));

    const searchInput =
      document.querySelector(".search input[type='search']") ||
      document.querySelector(".search input");

    const searchBtn = document.querySelector(".search button");

    if (!pillGroup) return;

    // =========================
    // CATEGORY NORMALIZATION
    // =========================
    const normalizeText = (s) => (s || "").trim().toLowerCase();

    const textToFilterKey = (label) => {
      const t = normalizeText(label);

      if (t === "all") return "all";
      if (t.includes("steel")) return "steel";
      if (t.includes("roof")) return "roofing";
      if (t.includes("hardware")) return "hardware";
      if (t.includes("stainless")) return "stainless";

      return "all";
    };

    const validFilters = new Set(["all", "steel", "roofing", "hardware", "stainless"]);

    // Ensure each pill has a data-filter and correct label (Hardware Items)
    function preparePills() {
      pills().forEach((btn) => {
        const key = btn.dataset.filter || textToFilterKey(btn.textContent);
        btn.dataset.filter = key;

        // Rename Hardware Materials -> Hardware Items (button text)
        if (key === "hardware") {
          btn.textContent = "Hardware Items";
        }
      });

      // If Stainless button is missing, add it
      const hasStainless = pills().some((b) => (b.dataset.filter || "") === "stainless");
      if (!hasStainless) {
        const stainlessBtn = document.createElement("button");
        stainlessBtn.className = "pill";
        stainlessBtn.type = "button";
        stainlessBtn.dataset.filter = "stainless";
        stainlessBtn.textContent = "Stainless Products";
        pillGroup.appendChild(stainlessBtn);
      }
    }

    // Ensure each card has data-category based on its .meta text (if not already set)
    function prepareCards() {
      cards().forEach((card) => {
        if (card.dataset.category) return;

        const meta = card.querySelector(".meta");
        const key = textToFilterKey(meta ? meta.textContent : "");
        card.dataset.category = key;
      });
    }

    // =========================
    // FILTERING
    // =========================
    let activeFilter = "all";

    function setActivePill(filterKey) {
      pills().forEach((b) => b.classList.remove("active"));
      const btn = pills().find((b) => (b.dataset.filter || "all") === filterKey);
      if (btn) btn.classList.add("active");
    }

    function applyFilters() {
      const q = normalizeText(searchInput ? searchInput.value : "");

      cards().forEach((card) => {
        const cat = normalizeText(card.dataset.category);
        const text = normalizeText(card.textContent);

        const matchCategory = activeFilter === "all" || cat === activeFilter;
        const matchSearch = !q || text.includes(q);

        // hidden removes it from the layout cleanly
        card.hidden = !(matchCategory && matchSearch);
      });
    }

    // =========================
    // URL PARAM SUPPORT
    // products.html?category=stainless&q=pipe
    // =========================
    function loadFromUrl() {
      const params = new URLSearchParams(window.location.search);

      const urlCategory = normalizeText(params.get("category"));
      const urlQ = params.get("q");

      if (searchInput && urlQ) searchInput.value = urlQ;

      if (validFilters.has(urlCategory) && urlCategory) {
        activeFilter = urlCategory;
      } else {
        activeFilter = "all";
      }

      setActivePill(activeFilter);
      applyFilters();
    }

    // =========================
    // EVENTS
    // =========================
    function bindEvents() {
      pills().forEach((btn) => {
        btn.addEventListener("click", () => {
          activeFilter = btn.dataset.filter || "all";
          setActivePill(activeFilter);
          applyFilters();
        });
      });

      if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
      }

      if (searchBtn) {
        searchBtn.addEventListener("click", applyFilters);
      }
    }

    // =========================
    // INIT
    // =========================
    preparePills();
    prepareCards();
    bindEvents();
    loadFromUrl();
  });
})();