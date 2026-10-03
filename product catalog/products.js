(() => {
  "use strict";

  // =========================
  // CONFIGURATION
  // =========================

  const API =
    "../admin dashboard/products.php?public=1&grouped=1";

  const IMAGE_FOLDER = "../uploads/products/";

  const CONTACT_PAGE = "contact.html";

  const PAGE_SIZE = 9;

  // =========================
  // HELPERS
  // =========================

  const $ = (id) => document.getElementById(id);

  const text = (value) => String(value ?? "").trim();

  const normalize = (value) => text(value).toLowerCase();

  const params = new URLSearchParams(location.search);

  function categoryKey(label) {
    const value = normalize(label);

    // Stainless must be checked before steel.
    if (value.includes("stainless")) return "stainless";
    if (value.includes("steel")) return "steel";
    if (value.includes("roof")) return "roofing";
    if (value.includes("hardware")) return "hardware";

    return value;
  }

  function node(tag, className, content) {
    const el = document.createElement(tag);

    if (className) {
      el.className = className;
    }

    if (content !== undefined) {
      el.textContent = content;
    }

    return el;
  }

  // =========================
  // DATABASE IMAGES
  // =========================

  function imageUrl(value) {
    const path = text(value);

    if (!path) return "";

    try {
      const url =
        /^https?:\/\//i.test(path) || path.startsWith("/")
          ? new URL(path, location.href)
          : new URL(
              IMAGE_FOLDER +
                path.split("/").map(encodeURIComponent).join("/"),
              location.href
            );

      return ["http:", "https:"].includes(url.protocol)
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  function photo(product, href) {
    const box = node(
      href ? "a" : "div",
      "catalog-photo"
    );

    if (href) {
      box.href = href;

      box.setAttribute(
        "aria-label",
        `View ${product.name}`
      );
    }

    const src = imageUrl(product.image);

    // Without an image, the gray area remains empty.
    if (src) {
      const img = node("img");

      img.alt = product.name;
      img.loading = href ? "lazy" : "eager";

      img.addEventListener(
        "error",
        () => img.remove(),
        { once: true }
      );

      img.src = src;
      box.append(img);
    }

    return box;
  }

  // =========================
  // PRODUCT LINKS
  // =========================

  function detailsUrl(product) {
    const url = new URL(
      "productview.html",
      location.href
    );

    // This is the existing API record ID.
    // The displayed P-0001 code comes from product_code.
    url.searchParams.set("id", product.id);

    // Preserve catalog filters for the Back link.
    for (const key of ["category", "q", "page"]) {
      if (params.has(key)) {
        url.searchParams.set(
          key,
          params.get(key)
        );
      }
    }

    return url.href;
  }

  // =========================
  // PRODUCT CARD
  // =========================

  function card(product) {
    const href = detailsUrl(product);

    const article = node(
      "article",
      "catalog-card"
    );

    const body = node(
      "div",
      "catalog-card-body"
    );

    const title = node("h3");

    const link = node(
      "a",
      "",
      product.name
    );

    link.href = href;
    title.append(link);

    const button = node(
      "a",
      "catalog-button",
      "View Details →"
    );

    button.href = href;

    button.setAttribute(
      "aria-label",
      `View details for ${product.name}`
    );

    body.append(
      node(
        "div",
        "catalog-meta",
        product.catalog
      ),
      title,
      node(
        "p",
        "",
        product.description ||
          "Contact us for more information about this product."
      ),
      button
    );

    article.append(
      photo(product, href),
      body
    );

    return article;
  }

  function status(message) {
    $("catalogStatus").textContent = message;
    $("catalogStatus").hidden = !message;
  }

  // =========================
  // CATALOG PAGE
  // =========================

  function catalog(products) {
    const buttons = [
      ...document.querySelectorAll("[data-filter]")
    ];

    let filter =
      normalize(params.get("category")) || "all";

    if (
      !buttons.some(
        (button) => button.dataset.filter === filter
      )
    ) {
      filter = "all";
    }

    let page = Math.max(
      1,
      Number.parseInt(params.get("page"), 10) || 1
    );

    $("productSearch").value =
      params.get("q") || "";

    function render() {
      const query = normalize(
        $("productSearch").value
      );

      const matches = products.filter((product) => {
        const matchesCategory =
          filter === "all" ||
          categoryKey(product.catalog) === filter;

        const searchableText = normalize(
          [
            product.name,
            product.catalog,
            product.description,
            product.product_code
          ].join(" ")
        );

        return (
          matchesCategory &&
          searchableText.includes(query)
        );
      });

      const pages = Math.ceil(
        matches.length / PAGE_SIZE
      );

      page = Math.min(
        page,
        Math.max(1, pages)
      );

      buttons.forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.filter === filter)
        );
      });

      // Keep the current catalog state in the URL.
      params.set("category", filter);
      params.set("page", String(page));

      if (query) {
        params.set(
          "q",
          $("productSearch").value.trim()
        );
      } else {
        params.delete("q");
      }

      history.replaceState(
        null,
        "",
        `${location.pathname}?${params}`
      );

      const start = (page - 1) * PAGE_SIZE;

      const visibleProducts = matches.slice(
        start,
        start + PAGE_SIZE
      );

      $("productGrid").replaceChildren(
        ...visibleProducts.map(card)
      );

      $("productCount").textContent = matches.length
        ? `${start + 1}–${Math.min(
            start + PAGE_SIZE,
            matches.length
          )} of ${matches.length} products`
        : "0 products";

      if (matches.length) {
        status("");
      } else if (products.length) {
        status(
          "No matching products. Try another search or category."
        );
      } else {
        status(
          "No products are currently listed in the catalog."
        );
      }

      // =========================
      // PAGINATION
      // =========================

      const pagination = $("catalogPagination");

      pagination.replaceChildren();

      if (pages <= 1) return;

      function pageButton(
        label,
        target,
        disabled = false
      ) {
        const button = node(
          "button",
          "",
          label
        );

        button.type = "button";
        button.disabled = disabled;

        if (String(label) === String(page)) {
          button.setAttribute(
            "aria-current",
            "page"
          );
        }

        button.addEventListener("click", () => {
          page = target;
          render();

          const current = pagination.querySelector(
            '[aria-current="page"]'
          );

          if (current) {
            current.focus({
              preventScroll: true
            });
          }

          $("productGrid").scrollIntoView({
            block: "start"
          });
        });

        pagination.append(button);
      }

      pageButton(
        "Previous",
        page - 1,
        page === 1
      );

      const visiblePages = new Set([
        1,
        pages,
        page - 1,
        page,
        page + 1
      ]);

      let previous = 0;

      [...visiblePages]
        .filter((number) =>
          number >= 1 && number <= pages
        )
        .sort((a, b) => a - b)
        .forEach((number) => {
          if (previous && number - previous > 1) {
            pagination.append(
              node("span", "", "…")
            );
          }

          pageButton(
            String(number),
            number
          );

          previous = number;
        });

      pageButton(
        "Next",
        page + 1,
        page === pages
      );
    }

    // =========================
    // CATALOG EVENTS
    // =========================

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        filter = button.dataset.filter;
        page = 1;
        render();
      });
    });

    $("productSearch").addEventListener(
      "input",
      () => {
        page = 1;
        render();
      }
    );

    $("catalogSearch").addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        page = 1;
        render();
      }
    );

    render();
  }

  // =========================
  // PRODUCT DETAILS PAGE
  // =========================

  function details(products) {
    const backParams = new URLSearchParams();

    for (const key of ["category", "q", "page"]) {
      if (params.has(key)) {
        backParams.set(
          key,
          params.get(key)
        );
      }
    }

    $("backToProducts").href =
      "products.html" +
      (backParams.size ? "?" + backParams : "");

    const product = products.find(
      (item) =>
        String(item.id) === params.get("id")
    );

    if (!product) {
      status(
        "This product is unavailable or is no longer listed. Please return to the catalog."
      );

      return;
    }

    document.title =
      `${product.name} - SCF Steel Trading`;

    const categoryUrl =
      "products.html?category=" +
      encodeURIComponent(
        categoryKey(product.catalog)
      );

    // =========================
    // BREADCRUMB
    // =========================

    const categoryLink = node(
      "a",
      "",
      product.catalog
    );

    categoryLink.href = categoryUrl;

    const catalogLink = node(
      "a",
      "",
      "Products"
    );

    catalogLink.href = "products.html";

    $("productBreadcrumb").append(
      catalogLink,
      " / ",
      categoryLink,
      " / ",
      product.name
    );

    // =========================
    // PRODUCT CONTENT
    // =========================

    const copy = node(
      "div",
      "catalog-detail-copy"
    );

    copy.append(
      node(
        "div",
        "catalog-meta",
        product.catalog
      ),
      node(
        "h1",
        "",
        product.name
      )
    );

    const description = node(
      "div",
      "catalog-description"
    );

    description.append(
      node(
        "h2",
        "",
        "Product Description"
      ),
      node(
        "p",
        "",
        product.description ||
          "No description has been added yet. Contact us for more information about this product."
      )
    );

    const inquiry = node(
      "a",
      "catalog-button",
      "Inquire about this product →"
    );

    inquiry.href = CONTACT_PAGE;

    copy.append(
      description,
      inquiry
    );

    $("productDetails").replaceChildren(
      photo(product),
      copy
    );

    $("productDetails").hidden = false;

    // =========================
    // RELATED PRODUCTS
    // =========================

    const related = products
      .filter((item) => {
        const differentProduct =
          item.id !== product.id;

        const sameCategory =
          categoryKey(item.catalog) ===
          categoryKey(product.catalog);

        return (
          differentProduct &&
          sameCategory
        );
      })
      .slice(0, 3);

    $("relatedSubtitle").textContent =
      `More from ${product.catalog}`;

    $("relatedAll").href = categoryUrl;

    $("relatedGrid").replaceChildren(
      ...related.map(card)
    );

    $("relatedSection").hidden =
      related.length === 0;

    status("");
  }

  // =========================
  // LOAD FROM EXISTING PHP
  // =========================

  async function init() {
    try {
      const response = await fetch(API, {
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(
          `Catalog request failed: ${response.status}`
        );
      }

      const data = await response.json();

      if (
        !data.ok ||
        !Array.isArray(data.products)
      ) {
        throw new Error(
          "Invalid catalog response"
        );
      }

      const products = data.products
        .filter(
          (product) =>
            Number(product.show_in_catalog) === 1
        )
        .map((product) => ({
          id: String(product.id),
          name: text(product.name),
          catalog: text(product.catalog),
          description: text(product.description),
          image: text(product.image),
          product_code: text(product.product_code)
        }));

      if (
        document.body.dataset.page === "details"
      ) {
        details(products);
      } else {
        catalog(products);
      }
    } catch (error) {
      console.error(error);

      status(
        "Unable to load products. Please refresh the page or try again later."
      );
    }
  }

  init();
})();