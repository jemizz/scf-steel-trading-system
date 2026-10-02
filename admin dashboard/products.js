(function () {
    'use strict';

    const tableBody = document.getElementById('productsTableBody');
    if (!tableBody) return;

    const PAGE_SIZE = 10;
    const VARIANT_PAGE_SIZE = 5;
    const API_PATHS = ['api/products.php', 'products.php', '../api/products.php', '/api/products.php'];
    let apiUrl;
    let products = [];
    let filteredProducts = [];
    let page = 1;
    let selected = null;
    let variantPage = 1;
    let manage = false;
    let busy = false;
    let editingId = null;

    const byId = id => document.getElementById(id);
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
    const hasValue = value => value !== null && value !== undefined && value !== '';
    const money = value => hasValue(value) ? Number(value).toLocaleString('en-PH', {
        style: 'currency', currency: 'PHP'
    }) : 'Not set';
    const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const imagePath = path => !path ? '' : path.includes('/') ? path : 'images/' + path;
    const groupKey = product => JSON.stringify([Number(product.category_id), product.name]);

    const icons = {
        view: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12"/><circle cx="12" cy="12" r="3"/>',
        edit: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4"/>',
        delete: '<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/>'
    };
    function actionButton(action, id, label) {
        return `<button type="button" class="action-btn ${action === 'delete' ? 'delete' : ''}"
            data-action="${action}" data-id="${Number(id)}" title="${escape(label)}" aria-label="${escape(label)}">
            <svg viewBox="0 0 24 24" aria-hidden="true">${icons[action]}</svg></button>`;
    }

    // Dialogs are inserted here so no extra modal HTML file is required.
    document.body.insertAdjacentHTML('beforeend', `
        <dialog id="productDetailsDialog" class="scf-product-dialog" aria-labelledby="productDetailsTitle">
            <header class="scf-dialog-header">
                <h2 id="productDetailsTitle">Product Details</h2>
                <button type="button" class="scf-close" data-close="productDetailsDialog" aria-label="Close product details">×</button>
            </header>
            <div class="scf-dialog-body">
                <div class="scf-product-summary">
                    <img id="detailImage" alt="">
                    <div><h3 id="detailName"></h3><p id="detailCategory"></p><span id="detailCount" class="scf-count"></span></div>
                </div>
                <p id="detailDescription" class="scf-description"></p>
                <h3 class="scf-section-title">Specifications &amp; Sizes</h3>
                <div class="scf-variant-tools">
                    <input type="search" id="variantSearch" placeholder="Search dimensions, color or record ID..." aria-label="Search specifications">
                    <select id="variantColor" aria-label="Filter by color"><option value="">All Colors</option></select>
                </div>
                <p id="detailError" class="scf-error" role="alert"></p>
                <div class="scf-variant-scroll"><table class="scf-variant-table">
                    <thead id="variantHead"></thead><tbody id="variantBody"></tbody>
                </table></div>
                <div class="scf-variant-footer">
                    <p id="variantCount" aria-live="polite"></p>
                    <div class="pagination">
                        <button type="button" id="variantPrevious" aria-label="Previous variants page">‹</button>
                        <span id="variantPage">1</span>
                        <button type="button" id="variantNext" aria-label="Next variants page">›</button>
                    </div>
                </div>
            </div>
            <footer class="scf-dialog-footer"><button type="button" class="scf-primary" data-close="productDetailsDialog">Close</button></footer>
        </dialog>
        <dialog id="variantEditDialog" class="scf-product-dialog scf-edit-dialog" aria-labelledby="variantEditTitle">
            <form id="variantEditForm">
                <header class="scf-dialog-header">
                    <h2 id="variantEditTitle">Edit Specification</h2>
                    <button type="button" class="scf-close" data-close="variantEditDialog" aria-label="Close editor">×</button>
                </header>
                <div class="scf-dialog-body"><p id="editRecordLabel"></p><div id="variantFields" class="scf-edit-grid"></div>
                    <p id="editError" class="scf-error" role="alert"></p>
                </div>
                <footer class="scf-dialog-footer">
                    <button type="button" class="scf-secondary" data-close="variantEditDialog">Cancel</button>
                    <button type="submit" class="scf-primary" id="saveVariant">Save Changes</button>
                </footer>
            </form>
        </dialog>
    `);

    const details = byId('productDetailsDialog');
    const editor = byId('variantEditDialog');
    const fields = [
        ['dimensions', 'Dimensions', 80], ['size', 'Size', 80], ['thickness', 'Thickness', 30],
        ['kilos', 'Weight / Kilos', 30], ['gauge', 'Gauge', 20], ['color', 'Color', 30],
        ['grade', 'Grade', 20], ['variant', 'Variant / Type', 60], ['brand', 'Brand', 60],
        ['price_unit', 'Unit', 20], ['price', 'Price'], ['price_half', 'Half Price'],
        ['price_quarter', 'Quarter Price'], ['price_per_ft', 'Price per Foot']
    ];
    const isPrice = key => key === 'price' || key.startsWith('price_') && key !== 'price_unit';

    async function readResponse(response) {
        let data;
        try { data = await response.json(); }
        catch { throw new Error('The server did not return JSON. Check the PHP API path and Apache.'); }
        if (!response.ok || !data.ok) throw new Error(data.error || 'Request failed.');
        return data;
    }

    async function loadProducts() {
        let data;
        try {
            if (apiUrl) {
                data = await readResponse(await fetch(apiUrl + '?grouped=1', { cache: 'no-store' }));
            } else {
                for (const path of API_PATHS) {
                    try {
                        data = await readResponse(await fetch(path + '?grouped=1', { cache: 'no-store' }));
                        if (!Array.isArray(data.products)) throw new Error('Missing products list.');
                        apiUrl = path;
                        break;
                    } catch (error) { if (path === API_PATHS[API_PATHS.length - 1]) throw error; }
                }
            }
            if (!Array.isArray(data.products) || data.products.some(p => !Array.isArray(p.variants))) {
                throw new Error('Please install the updated products.php file.');
            }
            products = data.products;
            filterProducts(false);
            return true;
        } catch (error) {
            products = [];
            filterProducts(false);
            const empty = byId('productsEmptyState');
            empty.querySelector('h3').textContent = 'Could not load products';
            empty.querySelector('p').textContent = error.message;
            return false;
        }
    }

    function searchable(product) {
        return [product.name, product.catalog, product.category,
            ...product.variants.flatMap(v => [v.id, v.spec, ...fields.map(([key]) => v[key])])
        ].join(' ').toLowerCase();
    }
    function filterProducts(reset = true) {
        const query = byId('productSearch').value.trim().toLowerCase();
        const category = byId('categoryFilter').value;
        filteredProducts = products.filter(p => (!query || searchable(p).includes(query)) &&
            (!category || slug(p.catalog) === category));
        if (reset) page = 1;
        renderProducts();
    }
    function renderProducts() {
        const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
        page = Math.min(page, totalPages);
        const visible = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        tableBody.innerHTML = visible.map(p => `<tr>
            <td>P-${String(p.id).padStart(4, '0')}</td>
            <td><div class="product-info"><div class="product-image">${p.image ? `<img src="${escape(imagePath(p.image))}" alt="">` : ''}</div>
                <div class="product-details"><strong>${escape(p.name)}</strong><span>${escape(p.category)}</span></div></div></td>
            <td>${escape(p.catalog)}</td><td>${p.variants.length} variants</td>
            <td><div class="product-actions">${actionButton('view', p.id, 'View ' + p.name)}
                ${actionButton('edit', p.id, 'Edit specifications for ' + p.name)}
                ${actionButton('delete', p.id, 'Deactivate all variants of ' + p.name)}</div></td></tr>`).join('');
        byId('visibleProductCount').textContent = visible.length;
        byId('totalProductCount').textContent = filteredProducts.length;
        byId('currentPage').textContent = page;
        byId('previousPage').disabled = page <= 1;
        byId('nextPage').disabled = page >= totalPages;
        const empty = byId('productsEmptyState');
        empty.style.display = visible.length ? 'none' : 'flex';
        empty.querySelector('h3').textContent = products.length ? 'No matching products' : 'No products yet';
        empty.querySelector('p').textContent = products.length ? 'Try another search or category.' : 'Products added to the system will appear here.';
    }

    function populateDetails() {
        byId('productDetailsTitle').textContent = manage ? 'Manage Specifications' : 'Product Details';
        byId('detailName').textContent = selected.name;
        byId('detailCategory').textContent = selected.catalog;
        byId('detailCount').textContent = selected.variants.length + ' variants';
        byId('detailDescription').textContent = selected.description || '';
        const img = byId('detailImage');
        img.hidden = !selected.image;
        img.alt = selected.name;
        if (selected.image) img.src = imagePath(selected.image);
        const currentColor = byId('variantColor').value;
        const colors = [...new Set(selected.variants.map(v => v.color).filter(hasValue))].sort();
        byId('variantColor').innerHTML = '<option value="">All Colors</option>' + colors.map(c => `<option value="${escape(c)}">${escape(c)}</option>`).join('');
        byId('variantColor').value = colors.includes(currentColor) ? currentColor : '';
        byId('variantColor').hidden = !colors.length;
        renderVariants();
    }
    function openDetails(product, editing) {
        selected = product;
        manage = editing;
        variantPage = 1;
        byId('variantSearch').value = '';
        byId('variantColor').value = '';
        byId('detailError').textContent = '';
        populateDetails();
        details.showModal();
    }
    function renderVariants() {
        const query = byId('variantSearch').value.toLowerCase().trim();
        const color = byId('variantColor').value;
        const variants = selected.variants.filter(v => (!color || v.color === color) &&
            (!query || [v.id, v.spec, ...fields.map(([key]) => v[key]), v.notes].join(' ').toLowerCase().includes(query)));
        const pageCount = Math.max(1, Math.ceil(variants.length / VARIANT_PAGE_SIZE));
        variantPage = Math.min(variantPage, pageCount);
        const visible = variants.slice((variantPage - 1) * VARIANT_PAGE_SIZE, variantPage * VARIANT_PAGE_SIZE);
        // Keep columns stable while searching. Omit fields unused by this product.
        const columns = fields.filter(([key]) => key === 'price' || key === 'price_unit' || selected.variants.some(v => hasValue(v[key])));
        if (selected.variants.some(v => hasValue(v.notes))) columns.push(['notes', 'Notes']);
        byId('variantHead').innerHTML = '<tr><th>Record ID</th>' + columns.map(([, label]) => `<th>${label}</th>`).join('') + (manage ? '<th>Actions</th>' : '') + '</tr>';
        byId('variantBody').innerHTML = visible.map(v => `<tr><td>${Number(v.id)}</td>` + columns.map(([key]) =>
            `<td>${escape(isPrice(key) ? money(v[key]) : hasValue(v[key]) ? v[key] : 'Not set')}</td>`
        ).join('') + (manage ? `<td><div class="product-actions">${actionButton('edit', v.id, 'Edit record ' + v.id)}${actionButton('delete', v.id, 'Deactivate record ' + v.id)}</div></td>` : '') + '</tr>').join('') ||
            `<tr><td colspan="${columns.length + (manage ? 2 : 1)}">No matching specifications.</td></tr>`;
        byId('variantCount').textContent = `Showing ${visible.length} of ${variants.length} variants`;
        byId('variantPage').textContent = `${variantPage} / ${pageCount}`;
        byId('variantPrevious').disabled = variantPage <= 1;
        byId('variantNext').disabled = variantPage >= pageCount;
    }

    async function refreshSelected() {
        const key = groupKey(selected);
        if (!await loadProducts()) {
            details.close();
            alert('The change was saved, but the list could not refresh. Reload the page.');
            return;
        }
        selected = products.find(p => groupKey(p) === key);
        if (selected) populateDetails();
        else details.close();
    }
    async function postAction(action, payload) {
        return readResponse(await fetch(apiUrl + '?action=' + action, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        }));
    }
    function openEditor(variant) {
        editingId = Number(variant.id);
        byId('editRecordLabel').textContent = `${selected.name} — Record ${editingId}`;
        byId('editError').textContent = '';
        byId('variantFields').innerHTML = fields.map(([key, label, max]) => `<label>${label}
            <input name="${key}" value="${escape(variant[key])}" ${isPrice(key) ? 'type="number" min="0" max="99999999.99" step="0.01"' : `type="text" maxlength="${max}"`}>
            </label>`).join('');
        editor.showModal();
    }

    tableBody.addEventListener('click', async event => {
        const button = event.target.closest('[data-action]');
        if (!button || busy) return;
        const product = products.find(p => Number(p.id) === Number(button.dataset.id));
        if (!product) return;
        if (button.dataset.action !== 'delete') return openDetails(product, button.dataset.action === 'edit');
        if (!confirm(`Deactivate "${product.name}" and ALL ${product.variants.length} specifications?\n\nThey will be hidden from active lists. Existing records will be retained.`)) return;
        busy = true;
        button.disabled = true;
        try {
            await postAction('deactivate-group', { id: product.id, name: product.name, category_id: product.category_id });
            await loadProducts();
        } catch (error) { alert(error.message); }
        finally { busy = false; button.disabled = false; }
    });
    byId('variantBody').addEventListener('click', async event => {
        const button = event.target.closest('[data-action]');
        if (!button || busy || !manage) return;
        const variant = selected.variants.find(v => Number(v.id) === Number(button.dataset.id));
        if (!variant) return;
        if (button.dataset.action === 'edit') return openEditor(variant);
        if (!confirm(`Deactivate ONLY record ${variant.id} of ${selected.name}?\n${variant.spec || ''}\n\nOther specifications will remain active.`)) return;
        busy = true;
        button.disabled = true;
        byId('detailError').textContent = '';
        try {
            await readResponse(await fetch(apiUrl + '?id=' + encodeURIComponent(variant.id), { method: 'DELETE' }));
            await refreshSelected();
        } catch (error) { byId('detailError').textContent = error.message; }
        finally { busy = false; button.disabled = false; }
    });
    byId('variantEditForm').addEventListener('submit', async event => {
        event.preventDefault();
        if (busy) return;
        busy = true;
        byId('saveVariant').disabled = true;
        byId('editError').textContent = '';
        try {
            const values = Object.fromEntries(new FormData(event.currentTarget));
            await postAction('update-variant', { ...values, id: editingId });
            editor.close();
            await refreshSelected();
        } catch (error) { byId('editError').textContent = error.message; }
        finally { busy = false; byId('saveVariant').disabled = false; }
    });
    document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => {
        if (!busy) byId(button.dataset.close).close();
    }));
    [details, editor].forEach(dialog => {
        dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
        dialog.addEventListener('close', () => document.body.classList.toggle('scf-dialog-open', details.open || editor.open));
    });
    new MutationObserver(() => document.body.classList.toggle('scf-dialog-open', details.open || editor.open))
        .observe(details, { attributes: true, attributeFilter: ['open'] });
    document.addEventListener('error', event => {
        if (event.target.tagName === 'IMG' && (tableBody.contains(event.target) || details.contains(event.target))) event.target.hidden = true;
    }, true);
    byId('productSearch').addEventListener('input', () => filterProducts());
    byId('categoryFilter').addEventListener('change', () => filterProducts());
    byId('previousPage').addEventListener('click', () => { if (page > 1) { page--; renderProducts(); } });
    byId('nextPage').addEventListener('click', () => { page++; renderProducts(); });
    ['variantSearch', 'variantColor'].forEach(id => byId(id).addEventListener(id === 'variantSearch' ? 'input' : 'change', () => { variantPage = 1; renderVariants(); }));
    byId('variantPrevious').addEventListener('click', () => { if (variantPage > 1) { variantPage--; renderVariants(); } });
    byId('variantNext').addEventListener('click', () => { variantPage++; renderVariants(); });

    function updateDateTime() {
        const now = new Date();
        if (byId('currentDate')) byId('currentDate').textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        if (byId('currentTime')) byId('currentTime').textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);
    window.reloadProducts = loadProducts;
    loadProducts();
})();
