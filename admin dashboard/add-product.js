(() => {

    const basePath =
        new URL(".", document.currentScript.src);


    let modal = null;

    let loading = null;

    let imageURL = null;

    let previousOverflow = "";

    let previousButton = null;

    let saving = false;

    let resolvedApi = null;


    const MAX_IMAGE_SIZE =
        2 * 1024 * 1024;


    // =========================
    // FIND PRODUCTS API
    // =========================

    async function apiUrl() {

        if (resolvedApi) {
            return resolvedApi;
        }


        const candidates = [

            window.PRODUCTS_API_URL,

            new URL(
                "api/products.php",
                basePath
            ).href,

            new URL(
                "products.php",
                basePath
            ).href,

            new URL(
                "../api/products.php",
                basePath
            ).href,

            new URL(
                "api/products.php",
                document.baseURI
            ).href,

            new URL(
                "products.php",
                document.baseURI
            ).href,

            new URL(
                "../api/products.php",
                document.baseURI
            ).href,

            new URL(
                "/api/products.php",
                document.baseURI
            ).href

        ].filter(Boolean);


        for (
            const url of new Set(candidates)
        ) {

            try {

                const response =
                    await fetch(
                        url,
                        {
                            cache: "no-store"
                        }
                    );


                if (!response.ok) {
                    continue;
                }


                const text =
                    await response.text();


                const data =
                    JSON.parse(text);


                if (
                    data &&
                    data.ok &&
                    Array.isArray(data.categories)
                ) {

                    resolvedApi = url;

                    return url;
                }


            } catch (error) {

                // Try next path.

            }

        }


        throw new Error(
            "Could not find products.php."
        );
    }


    // =========================
    // OPEN BUTTONS
    // =========================

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "#quickAddProduct, #addProductBtn"
                );


            if (!button) {
                return;
            }


            event.preventDefault();


            if (
                typeof closeTopbarMenus ===
                "function"
            ) {

                closeTopbarMenus();
            }


            openModal(button);

        }
    );


    // =========================
    // LOAD MODAL
    // =========================

    async function loadModal() {

        if (
            !document.querySelector(
                'link[data-add-product-style]'
            )
        ) {

            const stylesheet =
                document.createElement("link");


            stylesheet.rel =
                "stylesheet";


            stylesheet.href =
                new URL(
                    "add-product.css",
                    basePath
                ).href;


            stylesheet.dataset
                .addProductStyle = "true";


            document.head.appendChild(
                stylesheet
            );
        }


        const response =
            await fetch(
                new URL(
                    "add-product.html",
                    basePath
                ),
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Could not load add-product.html."
            );
        }


        const html =
            await response.text();


        document.body.insertAdjacentHTML(
            "beforeend",
            html
        );


        modal =
            document.getElementById(
                "addProductModal"
            );


        if (!modal) {

            throw new Error(
                "Add Product modal not found."
            );
        }


        modal
            .querySelectorAll(
                "[data-ap-close]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    closeModal
                );

            });


        modal.addEventListener(
            "cancel",
            function (event) {

                event.preventDefault();

                closeModal();

            }
        );


        modal.addEventListener(
            "close",
            function () {

                document.body.style.overflow =
                    previousOverflow;


                previousButton?.focus();

            }
        );


        modal
            .querySelector("#apImage")
            .addEventListener(
                "change",
                previewImage
            );


        modal
            .querySelector("#apRemoveImage")
            .addEventListener(
                "click",
                clearImage
            );


        modal
            .querySelector("#apForm")
            .addEventListener(
                "submit",
                saveProduct
            );

    }


    // =========================
    // CATEGORIES
    // =========================

    async function loadCategories() {

        const select =
            modal.querySelector(
                "#apCategory"
            );


        const response =
            await fetch(
                await apiUrl(),
                {
                    cache: "no-store"
                }
            );


        const text =
            await response.text();


        let data;


        try {

            data =
                JSON.parse(text);

        } catch (error) {

            throw new Error(
                "Invalid response from products.php."
            );

        }


        if (!data.ok) {

            throw new Error(
                data.error ||
                "Could not load categories."
            );

        }


        /*
         * Main categories only:
         * Steel Products
         * Roofing Materials
         * Hardware Materials
         */
        const categories =
            (data.categories || [])
                .filter(
                    category =>
                        !category.parent_id
                );


        select.replaceChildren(
            new Option(
                "Select a category",
                ""
            )
        );


        categories.forEach(
            category => {

                select.appendChild(
                    new Option(
                        category.name,
                        category.id
                    )
                );

            }
        );

    }


    // =========================
    // OPEN MODAL
    // =========================

    async function openModal(button) {

        try {

            if (!modal) {

                if (!loading) {

                    loading =
                        loadModal()
                            .catch(error => {

                                loading = null;

                                throw error;

                            });

                }


                await loading;

            }


            if (modal.open) {
                return;
            }


            await loadCategories();


            const form =
                modal.querySelector(
                    "#apForm"
                );


            form.reset();


            modal.querySelector(
                "#apProductId"
            ).value =
                "Auto-generated";


            form.elements[
                "showInCatalog"
            ].checked =
                true;


            clearImage();

            showError("");


            previousButton =
                button;


            previousOverflow =
                document.body.style
                    .overflow;


            document.body.style
                .overflow =
                "hidden";


            modal.showModal();


            modal
                .querySelector(
                    '[name="name"]'
                )
                .focus();


        } catch (error) {

            alert(
                error.message
            );

        }

    }


    // =========================
    // CLOSE MODAL
    // =========================

    function closeModal() {

        if (
            modal &&
            modal.open
        ) {

            modal.close();

        }

    }


    // =========================
    // SAVE PRODUCT
    // =========================

    async function saveProduct(event) {

        event.preventDefault();


        if (saving) {
            return;
        }


        const form =
            modal.querySelector(
                "#apForm"
            );


        const saveButton =
            modal.querySelector(
                "#apSave"
            );


        const name =
            form.elements["name"]
                .value
                .trim();


        const categoryId =
            form.elements[
                "category_id"
            ].value;


        const description =
            form.elements[
                "description"
            ].value
                .trim();


        const showInCatalog =
            form.elements[
                "showInCatalog"
            ].checked;


        const imageFile =
            modal.querySelector(
                "#apImage"
            ).files[0];


        // =========================
        // VALIDATION
        // =========================

        if (!name) {

            showError(
                "Product name is required."
            );

            return;
        }


        if (!categoryId) {

            showError(
                "Please select a category."
            );

            return;
        }


        // =========================
        // FORM DATA
        // =========================

        const formData =
            new FormData();


        formData.append(
            "name",
            name
        );


        formData.append(
            "category_id",
            categoryId
        );


        formData.append(
            "description",
            description
        );


        formData.append(
            "showInCatalog",
            showInCatalog
                ? "1"
                : "0"
        );


        /*
         * IMPORTANT:
         *
         * We DO NOT send variants here.
         *
         * A product can now be created
         * first. Existing variants are
         * still supported by products.php.
         */


        if (imageFile) {

            formData.append(
                "image",
                imageFile
            );

        }


        saving = true;


        saveButton.disabled =
            true;


        saveButton.textContent =
            "Saving...";


        showError("");


        try {

            const response =
                await fetch(
                    await apiUrl(),
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const text =
                await response.text();


            let data;


            try {

                data =
                    JSON.parse(text);

            } catch (error) {

                throw new Error(
                    "Server error: " +
                    text
                        .slice(0, 200)
                        .replace(
                            /\s+/g,
                            " "
                        )
                );

            }


            if (
                !response.ok ||
                !data.ok
            ) {

                throw new Error(
                    data.error ||
                    "Could not save product."
                );

            }


            closeModal();


            showToast(
                data.message ||
                "Product added successfully."
            );


            if (
                typeof window.reloadProducts ===
                "function"
            ) {

                window.reloadProducts(
                    true
                );

            }


        } catch (error) {

            showError(
                error.message
            );


        } finally {

            saving = false;


            saveButton.disabled =
                false;


            saveButton.textContent =
                "Save Product";

        }

    }


    // =========================
    // IMAGE PREVIEW
    // =========================

    function previewImage(event) {

        const file =
            event.target.files[0];


        if (!file) {

            clearImage();

            return;

        }


        const allowedTypes = [

            "image/png",

            "image/jpeg",

            "image/webp"

        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            event.target.value = "";


            clearImage();


            showError(
                "Choose a PNG, JPG or WebP image."
            );


            return;

        }


        if (
            file.size >
            MAX_IMAGE_SIZE
        ) {

            event.target.value = "";


            clearImage();


            showError(
                "Choose an image up to 2 MB."
            );


            return;

        }


        if (imageURL) {

            URL.revokeObjectURL(
                imageURL
            );

        }


        imageURL =
            URL.createObjectURL(
                file
            );


        const preview =
            modal.querySelector(
                "#apImagePreview"
            );


        const placeholder =
            modal.querySelector(
                "#apImagePlaceholder"
            );


        preview.src =
            imageURL;


        preview.hidden =
            false;


        placeholder.hidden =
            true;


        modal.querySelector(
            "#apRemoveImage"
        ).hidden =
            false;


        showError("");

    }


    // =========================
    // CLEAR IMAGE
    // =========================

    function clearImage() {

        if (!modal) {
            return;
        }


        if (imageURL) {

            URL.revokeObjectURL(
                imageURL
            );


            imageURL = null;

        }


        const preview =
            modal.querySelector(
                "#apImagePreview"
            );


        const input =
            modal.querySelector(
                "#apImage"
            );


        const removeButton =
            modal.querySelector(
                "#apRemoveImage"
            );


        const placeholder =
            modal.querySelector(
                "#apImagePlaceholder"
            );


        preview?.removeAttribute(
            "src"
        );


        if (preview) {

            preview.hidden =
                true;

        }


        if (input) {

            input.value =
                "";

        }


        if (removeButton) {

            removeButton.hidden =
                true;

        }


        if (placeholder) {

            placeholder.hidden =
                false;

        }

    }


    // =========================
    // ERROR
    // =========================

    function showError(message) {

        if (!modal) {
            return;
        }


        const error =
            modal.querySelector(
                "#apError"
            );


        error.textContent =
            message;


        error.hidden =
            !message;

    }


    // =========================
    // TOAST
    // =========================

    function showToast(message) {

        document
            .querySelector(
                ".ap-toast"
            )
            ?.remove();


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            "ap-toast";


        toast.textContent =
            message;


        document.body.appendChild(
            toast
        );


        setTimeout(
            () => toast.remove(),
            3500
        );

    }

})();