<?php

declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


// =========================
// JSON RESPONSE
// =========================

function respond(array $data, int $status = 200): void
{
    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );

    exit;
}


// =========================
// UNEXPECTED ERRORS
// =========================

set_exception_handler(function (Throwable $error): void {
    global $pdo;

    if (
        isset($pdo) &&
        $pdo instanceof PDO &&
        $pdo->inTransaction()
    ) {
        $pdo->rollBack();
    }

    error_log((string) $error);

    respond([
        'ok' => false,
        'error' => 'A server error occurred. Check the PHP error log.'
    ], 500);
});

require __DIR__ . '/db.php';

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);


// =========================
// VARIANT FIELDS
// =========================

const TEXT_LIMITS = [
    'dimensions' => 80,
    'size' => 80,
    'thickness' => 30,
    'kilos' => 30,
    'gauge' => 20,
    'color' => 30,
    'grade' => 20,
    'variant' => 60,
    'brand' => 60,
    'price_unit' => 20
];

const PRICE_FIELDS = [
    'price',
    'price_half',
    'price_quarter',
    'price_per_ft'
];


// =========================
// BASIC HELPERS
// =========================

function valid_id($value): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT);

    if ($id === false || $id < 1) {
        throw new InvalidArgumentException(
            'A valid record ID is required.'
        );
    }

    return $id;
}

function text_value($value): string
{
    if ($value !== null && !is_scalar($value)) {
        throw new InvalidArgumentException(
            'Invalid field value.'
        );
    }

    return trim((string) ($value ?? ''));
}

function limited_text(
    $value,
    int $maximum,
    string $label,
    bool $required = false
): string {
    $text = text_value($value);
    $length = preg_match_all('/./us', $text);

    if ($required && $text === '') {
        throw new InvalidArgumentException(
            $label . ' is required.'
        );
    }

    if ($length === false || $length > $maximum) {
        throw new InvalidArgumentException(
            $label . ' must contain no more than ' .
            $maximum . ' characters.'
        );
    }

    return $text;
}

function assigned_product_id(array $row): ?int
{
    $id = (int) ($row['product_id'] ?? 0);

    return $id > 0 ? $id : null;
}

function product_code(?int $id): ?string
{
    if ($id === null || $id < 1) {
        return null;
    }

    return 'P-' . str_pad(
        (string) $id,
        4,
        '0',
        STR_PAD_LEFT
    );
}


// =========================
// PRODUCT GROUP HELPERS
// =========================

function group_key(array $row): string
{
    return json_encode([
        (int) $row['category_id'],
        assigned_product_id($row) !== null
            ? null
            : (string) $row['name']
    ]);
}

function group_name(array $row): string
{
    return assigned_product_id($row) !== null
        ? (string) $row['category_name']
        : (string) $row['name'];
}

function group_condition(
    array $row,
    string $prefix = ''
): array {
    $condition = $prefix . 'category_id = ?';

    $parameters = [
        (int) $row['category_id']
    ];

    // Preserve older products saved directly under a main category.
    if (assigned_product_id($row) === null) {
        $condition .=
            ' AND BINARY ' . $prefix . 'name = BINARY ?';

        $parameters[] = $row['name'];
    }

    return [$condition, $parameters];
}


// =========================
// VARIANT VALIDATION
// =========================

function spec_of(array $row): string
{
    $parts = [];

    foreach ([
        'dimensions',
        'size',
        'thickness',
        'gauge',
        'kilos',
        'grade',
        'color',
        'variant',
        'brand'
    ] as $field) {
        $value = $row[$field] ?? null;

        if ($value !== null && $value !== '') {
            $parts[] = $value;
        }
    }

    return implode(' · ', array_unique($parts));
}

function variant_values(array $input): array
{
    $values = [];

    foreach (TEXT_LIMITS as $field => $limit) {
        if (!array_key_exists($field, $input)) {
            continue;
        }

        $value = limited_text(
            $input[$field],
            $limit,
            $field
        );

        $values[$field] = $value === '' ? null : $value;
    }

    foreach (PRICE_FIELDS as $field) {
        if (!array_key_exists($field, $input)) {
            continue;
        }

        $value = text_value($input[$field]);

        if (
            $value !== '' &&
            !preg_match('/^\d{1,8}(\.\d{1,2})?$/D', $value)
        ) {
            throw new InvalidArgumentException(
                'Prices must be nonnegative with at most two decimal places.'
            );
        }

        $values[$field] = $value === '' ? null : $value;
    }

    return $values;
}

function require_new_variant(array $values): void
{
    if (spec_of($values) === '') {
        throw new InvalidArgumentException(
            'Enter at least one specification, such as dimensions, size or type.'
        );
    }

    if (($values['price'] ?? null) === null) {
        throw new InvalidArgumentException(
            'A price is required.'
        );
    }

    if (($values['price_unit'] ?? null) === null) {
        throw new InvalidArgumentException(
            'A unit is required.'
        );
    }
}


// =========================
// INSERT DATABASE ROW
// =========================

function insert_product_row(PDO $pdo, array $values): int
{
    // Callers supply only fixed, server-defined column names.

    $columns = array_keys($values);

    $columnSql = implode(', ', array_map(
        static fn(string $column): string =>
            '`' . $column . '`',
        $columns
    ));

    $placeholders = implode(
        ', ',
        array_fill(0, count($columns), '?')
    );

    $statement = $pdo->prepare(
        'INSERT INTO products (' . $columnSql . ')
         VALUES (' . $placeholders . ')'
    );

    $statement->execute(array_values($values));

    return (int) $pdo->lastInsertId();
}


// =========================
// IMAGE UPLOAD
// =========================

function save_product_image(?string &$destination): ?string
{
    if (!isset($_FILES['image'])) {
        return null;
    }

    $upload = $_FILES['image'];

    if (
        !isset($upload['error']) ||
        is_array($upload['error'])
    ) {
        throw new InvalidArgumentException(
            'Invalid image upload.'
        );
    }

    $uploadError = (int) $upload['error'];

    if ($uploadError === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($uploadError !== UPLOAD_ERR_OK) {
        throw new InvalidArgumentException(
            'Image upload failed. Choose an image up to 2 MB.'
        );
    }

    $allowed = [
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
        'image/webp' => 'webp'
    ];

    $mime = mime_content_type(
        $upload['tmp_name']
    ) ?: '';

    if (
        !isset($allowed[$mime]) ||
        (int) $upload['size'] > 2 * 1024 * 1024
    ) {
        throw new InvalidArgumentException(
            'Image must be PNG, JPG, or WebP up to 2 MB.'
        );
    }

    $folder = dirname(__DIR__) . '/uploads/products';

    if (
        !is_dir($folder) &&
        !mkdir($folder, 0775, true) &&
        !is_dir($folder)
    ) {
        throw new RuntimeException(
            'Could not create the upload folder.'
        );
    }

    $filename = 'product-'
        . date('Ymd-His')
        . '-'
        . bin2hex(random_bytes(6))
        . '.'
        . $allowed[$mime];

    $destination = $folder . '/' . $filename;

    if (!move_uploaded_file(
        $upload['tmp_name'],
        $destination
    )) {
        throw new RuntimeException(
            'Could not save the product image.'
        );
    }

    return 'uploads/products/' . $filename;
}


// =========================
// MAP DATABASE RECORD
// =========================

function map_row(array $row): array
{
    $productId = assigned_product_id($row);
    $catalog = (string) ($row['catalog'] ?? '');

    $result = [
        'id' => (int) $row['id'],
        'product_id' => $productId,
        'product_code' => product_code($productId),
        'group_key' => group_key($row),

        'category_id' => (int) $row['category_id'],
        'category' => $row['category_name'] ?? '',
        'catalog' => $catalog,
        'catalog_label' => $catalog === 'Hardware Items'
            ? 'Hardware Materials'
            : $catalog,

        'name' => $row['name'],
        'spec' => spec_of($row),
        'description' => $row['description'] ?? null,
        'image' => $row['image_path'] ?? null,
        'notes' => $row['notes'] ?? null,

        'is_active' => (int) $row['is_active'],
        'is_variant' => (int) $row['is_variant'],
        'show_in_catalog' => (int) $row['show_in_catalog']
    ];

    foreach (array_keys(TEXT_LIMITS) as $field) {
        $result[$field] = $row[$field] ?? null;
    }

    foreach (PRICE_FIELDS as $field) {
        $result[$field] = isset($row[$field])
            ? (float) $row[$field]
            : null;
    }

    return $result;
}


// =========================
// BASE QUERY
// =========================

$select = "
    SELECT
        p.*,
        c.name AS category_name,
        c.product_id
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
";

$method = $_SERVER['REQUEST_METHOD'];

$publicOnly = ($_GET['public'] ?? '') === '1';

$publicFilter = $publicOnly
    ? ' AND p.show_in_catalog = 1'
    : '';


// =========================
// GET PRODUCTS
// =========================

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        try {
            $id = valid_id($_GET['id']);
        } catch (InvalidArgumentException $error) {
            respond([
                'ok' => false,
                'error' => $error->getMessage()
            ], 422);
        }

        $statement = $pdo->prepare(
            $select . '
            WHERE p.id = ?
              AND p.is_active = 1
            ' . $publicFilter . '
            LIMIT 1'
        );

        $statement->execute([$id]);
        $row = $statement->fetch();

        if (!$row) {
            respond([
                'ok' => false,
                'error' => 'Product not found.'
            ], 404);
        }

        [$condition, $parameters] = group_condition(
            $row,
            'p.'
        );

        $siblings = $pdo->prepare(
            $select . '
            WHERE ' . $condition . '
              AND p.is_active = 1
              AND p.is_variant = 1
            ' . $publicFilter . '
            ORDER BY p.id'
        );

        $siblings->execute($parameters);

        respond([
            'ok' => true,
            'product' => map_row($row),
            'variants' => array_map(
                'map_row',
                $siblings->fetchAll()
            )
        ]);
    }

    $grouped = ($_GET['grouped'] ?? '') === '1';

    // Grouped requests include product records so a product
    // remains visible even when it has zero variants.
    //
    // Ungrouped requests return actual variant records only.

    $variantFilter = $grouped
        ? ''
        : ' AND p.is_variant = 1';

    $rows = $pdo->query(
        $select . '
        WHERE p.is_active = 1
        ' . $publicFilter . '
        ' . $variantFilter . '
        ORDER BY
            c.product_id IS NULL,
            c.product_id,
            p.is_variant,
            p.id'
    )->fetchAll();

    $products = array_map('map_row', $rows);

    $categories = $pdo->query(
        'SELECT id, product_id, name, parent_id, sort_order
         FROM categories
         ORDER BY sort_order, name'
    )->fetchAll();

    if ($grouped) {
        $groups = [];

        foreach ($products as $product) {
            $key = $product['group_key'];

            if (!isset($groups[$key])) {
                $groups[$key] = [
                    // Reference used by group actions.
                    'id' => $product['id'],

                    'product_id' => $product['product_id'],
                    'product_code' => $product['product_code'],
                    'group_key' => $key,
                    'category_id' => $product['category_id'],

                    'name' => $product['product_id'] !== null
                        ? $product['category']
                        : $product['name'],

                    'catalog' => $product['catalog'],
                    'catalog_label' => $product['catalog_label'],
                    'category' => $product['category'],

                    'image' => $product['image'],
                    'description' => $product['description'],
                    'show_in_catalog' => $product['show_in_catalog'],

                    'price' => null,
                    'price_unit' => null,
                    'variant_count' => 0,
                    'variants' => []
                ];
            }

            if ($product['is_variant'] === 0) {
                // This is the product record, not a variant.
                $groups[$key]['id'] = $product['id'];
                $groups[$key]['image'] = $product['image'];
                $groups[$key]['description'] = $product['description'];
                $groups[$key]['show_in_catalog'] =
                    $product['show_in_catalog'];

                continue;
            }

            $groups[$key]['variants'][] = $product;
            $groups[$key]['variant_count']++;

            if (
                $product['price'] !== null &&
                (
                    $groups[$key]['price'] === null ||
                    $product['price'] < $groups[$key]['price']
                )
            ) {
                $groups[$key]['price'] = $product['price'];
                $groups[$key]['price_unit'] = $product['price_unit'];
            }

            if (!$groups[$key]['image'] && $product['image']) {
                $groups[$key]['image'] = $product['image'];
            }

            if (
                !$groups[$key]['description'] &&
                $product['description']
            ) {
                $groups[$key]['description'] =
                    $product['description'];
            }
        }

        $groupedProducts = array_values($groups);

        usort(
            $groupedProducts,
            static function (array $first, array $second): int {
                $firstId = $first['product_id'] ?? PHP_INT_MAX;
                $secondId = $second['product_id'] ?? PHP_INT_MAX;

                return ($firstId <=> $secondId)
                    ?: strcmp($first['name'], $second['name']);
            }
        );

        respond([
            'ok' => true,
            'source' => 'database',
            'categories' => $categories,
            'products' => $groupedProducts
        ]);
    }

    respond([
        'ok' => true,
        'source' => 'database',
        'categories' => $categories,
        'products' => $products
    ]);
}


// =========================
// ADD / EDIT / DEACTIVATE
// VARIANTS AND PRODUCT GROUPS
// =========================

if ($method === 'POST' && isset($_GET['action'])) {
    $input = json_decode(
        file_get_contents('php://input'),
        true
    );

    if (!is_array($input)) {
        respond([
            'ok' => false,
            'error' => 'Invalid request.'
        ], 422);
    }

    try {
        $id = valid_id($input['id'] ?? null);
        $action = (string) $_GET['action'];

        if (!in_array($action, [
            'add-variant',
            'update-variant',
            'deactivate-group'
        ], true)) {
            throw new InvalidArgumentException(
                'Unknown action.'
            );
        }

        $pdo->beginTransaction();

        $lookup = $pdo->prepare(
            $select . '
            WHERE p.id = ?
              AND p.is_active = 1
            FOR UPDATE'
        );

        $lookup->execute([$id]);
        $record = $lookup->fetch();

        if (!$record) {
            throw new InvalidArgumentException(
                'This record is no longer active. Refresh the page.'
            );
        }


        // -------------------------
        // UPDATE ONE VARIANT
        // -------------------------

        if ($action === 'update-variant') {
            if ((int) $record['is_variant'] !== 1) {
                throw new InvalidArgumentException(
                    'Select a variant to edit.'
                );
            }

            $values = variant_values($input);

            if (!$values) {
                throw new InvalidArgumentException(
                    'No changes supplied.'
                );
            }

            $changes = [];

            foreach (array_keys($values) as $field) {
                $changes[] = '`' . $field . '` = ?';
            }

            $parameters = array_values($values);
            $parameters[] = $id;

            $update = $pdo->prepare(
                'UPDATE products
                 SET ' . implode(', ', $changes) . '
                 WHERE id = ? AND is_variant = 1'
            );

            $update->execute($parameters);

            $pdo->commit();

            respond([
                'ok' => true,
                'message' => 'Variant updated successfully.'
            ]);
        }


        // -------------------------
        // VERIFY GROUP
        // -------------------------

        if (
            ($input['name'] ?? '') !== group_name($record) ||
            (int) ($input['category_id'] ?? 0) !==
                (int) $record['category_id']
        ) {
            throw new InvalidArgumentException(
                'The product group changed. Refresh the page.'
            );
        }

        [$condition, $parameters] = group_condition($record);


        // -------------------------
        // ADD VARIANT
        // -------------------------

        if ($action === 'add-variant') {
            $values = variant_values($input);
            require_new_variant($values);

            $itemName = limited_text(
                $input['item_name'] ?? group_name($record),
                200,
                'Product / Item Name',
                true
            );

            if (
                assigned_product_id($record) === null &&
                $itemName !== $record['name']
            ) {
                throw new InvalidArgumentException(
                    'Keep the same item name until this product has a numbered category.'
                );
            }

            // Prefer the saved product record for shared metadata.
            $findProduct = $pdo->prepare(
                'SELECT *
                 FROM products
                 WHERE ' . $condition . '
                   AND is_active = 1
                   AND is_variant = 0
                 ORDER BY id
                 LIMIT 1
                 FOR UPDATE'
            );

            $findProduct->execute($parameters);

            $metadata = $findProduct->fetch() ?: $record;

            $newRow = [
                'category_id' => $record['category_id'],
                'catalog' => $metadata['catalog'],
                'name' => $itemName,
                'description' => $metadata['description'],
                'image_path' => $metadata['image_path'],
                'notes' => null,

                'is_active' => 1,
                'is_variant' => 1,
                'show_in_catalog' =>
                    (int) $metadata['show_in_catalog']
            ];

            foreach (array_merge(
                array_keys(TEXT_LIMITS),
                PRICE_FIELDS
            ) as $field) {
                $newRow[$field] = $values[$field] ?? null;
            }

            $newId = insert_product_row($pdo, $newRow);

            $pdo->commit();

            respond([
                'ok' => true,
                'id' => $newId,
                'message' => 'Variant added successfully.'
            ], 201);
        }


        // -------------------------
        // DEACTIVATE WHOLE PRODUCT
        // -------------------------

        $delete = $pdo->prepare(
            'UPDATE products
             SET is_active = 0
             WHERE ' . $condition . '
               AND is_active = 1'
        );

        $delete->execute($parameters);

        $count = $delete->rowCount();

        $pdo->commit();

        respond([
            'ok' => true,
            'affected' => $count
        ]);

    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        $validation = $error instanceof InvalidArgumentException;

        if (!$validation) {
            error_log((string) $error);
        }

        respond([
            'ok' => false,
            'error' => $validation
                ? $error->getMessage()
                : 'Could not save the change.'
        ], $validation ? 422 : 500);
    }
}


// =========================
// ADD PRODUCT
// =========================

// Matches your current add-product.js:
// name
// category_id (main category)
// description
// showInCatalog
// image (optional)
//
// Variants are optional.

if ($method === 'POST') {
    $destination = null;

    try {
        $name = limited_text(
            $_POST['name'] ?? '',
            100,
            'Product name',
            true
        );

        // categories.name is VARCHAR(100) in your database.
        $mainCategoryId = valid_id(
            $_POST['category_id'] ?? null
        );

        $description = text_value(
            $_POST['description'] ?? ''
        );

        if (strlen($description) > 65535) {
            throw new InvalidArgumentException(
                'Description is too long.'
            );
        }

        $showInCatalog = filter_var(
            $_POST['showInCatalog'] ?? false,
            FILTER_VALIDATE_BOOLEAN
        ) ? 1 : 0;


        // -------------------------
        // OPTIONAL LEGACY VARIANTS
        // -------------------------

        $preparedVariants = [];

        if (isset($_POST['variants'])) {
            $variants = json_decode(
                text_value($_POST['variants']),
                true
            );

            if (
                !is_array($variants) ||
                !array_is_list($variants)
            ) {
                throw new InvalidArgumentException(
                    'Invalid variants data.'
                );
            }

            foreach ($variants as $variant) {
                if (!is_array($variant)) {
                    throw new InvalidArgumentException(
                        'Invalid variant data.'
                    );
                }

                $spec = text_value($variant['spec'] ?? '');

                $values = variant_values([
                    'dimensions' => $spec,
                    'size' => $spec,
                    'price' => $variant['price'] ?? null,
                    'price_unit' => text_value(
                        $variant['unit'] ?? 'pc'
                    ) ?: 'pc',
                    'variant' => text_value(
                        $variant['sku'] ?? ''
                    )
                ]);

                require_new_variant($values);

                $minStock = filter_var(
                    $variant['min_stock'] ?? 0,
                    FILTER_VALIDATE_INT,
                    ['options' => ['min_range' => 0]]
                );

                if ($minStock === false) {
                    throw new InvalidArgumentException(
                        'Minimum stock must be a nonnegative whole number.'
                    );
                }

                $preparedVariants[] = [
                    'values' => $values,
                    'notes' => $minStock > 0
                        ? 'min_stock:' . $minStock
                        : null
                ];
            }
        }


        // -------------------------
        // SAVE IMAGE
        // -------------------------

        $imagePath = save_product_image($destination);


        // -------------------------
        // START TRANSACTION
        // -------------------------

        $pdo->beginTransaction();

        // Serialize Product ID allocation.
        // Read all existing category IDs while holding row locks.

        $categoryRows = $pdo->query(
            'SELECT id, product_id, name, parent_id, sort_order
             FROM categories
             ORDER BY id
             FOR UPDATE'
        )->fetchAll();

        $categoryLookup = [];

        $highestProductId = 0;
        $highestSortOrder = 0;

        foreach ($categoryRows as $categoryRecord) {
            $categoryLookup[(int) $categoryRecord['id']] =
                $categoryRecord;

            $highestProductId = max(
                $highestProductId,
                (int) ($categoryRecord['product_id'] ?? 0)
            );

            $highestSortOrder = max(
                $highestSortOrder,
                (int) $categoryRecord['sort_order']
            );
        }

        $mainCategory = $categoryLookup[$mainCategoryId] ?? null;

        if (
            !$mainCategory ||
            $mainCategory['parent_id'] !== null
        ) {
            throw new InvalidArgumentException(
                'Please select a main category.'
            );
        }

        $catalog = $mainCategory['name'];


        // -------------------------
        // CHECK PRODUCT CATEGORY
        // -------------------------

        $findCategory = $pdo->prepare(
            'SELECT id, product_id
             FROM categories
             WHERE parent_id = ?
               AND name = ?
             ORDER BY id
             LIMIT 1
             FOR UPDATE'
        );

        $findCategory->execute([
            $mainCategoryId,
            $name
        ]);

        $existingCategory = $findCategory->fetch();

        if ($existingCategory) {
            $categoryId = (int) $existingCategory['id'];

            $existingProduct = $pdo->prepare(
                'SELECT id
                 FROM products
                 WHERE category_id = ?
                 LIMIT 1
                 FOR UPDATE'
            );

            $existingProduct->execute([$categoryId]);

            if ($existingProduct->fetch()) {
                throw new InvalidArgumentException(
                    'This product already exists in the selected category. Use Edit → Add Variant for additional specifications.'
                );
            }

            $assignedProductId = (int) (
                $existingCategory['product_id'] ?? 0
            );

            if ($assignedProductId < 1) {
                $assignedProductId = $highestProductId + 1;

                $updateCategory = $pdo->prepare(
                    'UPDATE categories
                     SET product_id = ?
                     WHERE id = ?'
                );

                $updateCategory->execute([
                    $assignedProductId,
                    $categoryId
                ]);
            }

        } else {
            $assignedProductId = $highestProductId + 1;

            $createCategory = $pdo->prepare(
                'INSERT INTO categories (
                    product_id,
                    name,
                    parent_id,
                    sort_order
                 )
                 VALUES (?, ?, ?, ?)'
            );

            $createCategory->execute([
                $assignedProductId,
                $name,
                $mainCategoryId,
                $highestSortOrder + 1
            ]);

            $categoryId = (int) $pdo->lastInsertId();
        }


        // -------------------------
        // SAVE PRODUCT RECORD
        // -------------------------

        $productRecord = [
            'category_id' => $categoryId,
            'catalog' => $catalog,
            'name' => $name,
            'description' => $description !== ''
                ? $description
                : null,
            'image_path' => $imagePath,
            'notes' => null,

            // A product stays active in the admin list even
            // when "Show in Product Catalog" is unchecked.
            'is_active' => 1,
            'show_in_catalog' => $showInCatalog,

            // Product metadata record, not a variant.
            'is_variant' => 0
        ];

        $recordId = insert_product_row(
            $pdo,
            $productRecord
        );


        // -------------------------
        // SAVE OPTIONAL VARIANTS
        // -------------------------

        $variantIds = [];

        foreach ($preparedVariants as $prepared) {
            $variantRecord = $productRecord;

            $variantRecord['is_variant'] = 1;
            $variantRecord['notes'] = $prepared['notes'];

            foreach ($prepared['values'] as $field => $value) {
                $variantRecord[$field] = $value;
            }

            $variantIds[] = insert_product_row(
                $pdo,
                $variantRecord
            );
        }

        $pdo->commit();

        $code = product_code($assignedProductId);

        respond([
            'ok' => true,
            'id' => $recordId,
            'ids' => $variantIds,
            'category_id' => $categoryId,
            'product_id' => $assignedProductId,
            'product_code' => $code,
            'variant_count' => count($variantIds),
            'message' => $code . ' — Product added successfully.'
        ], 201);

    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        if ($destination !== null && is_file($destination)) {
            @unlink($destination);
        }

        $validation = $error instanceof InvalidArgumentException;

        if (!$validation) {
            error_log((string) $error);
        }

        respond([
            'ok' => false,
            'error' => $validation
                ? $error->getMessage()
                : 'Could not save the product.'
        ], $validation ? 422 : 500);
    }
}


// =========================
// DEACTIVATE ONE VARIANT
// =========================

if ($method === 'DELETE') {
    try {
        $id = valid_id($_GET['id'] ?? null);

        $statement = $pdo->prepare(
            'UPDATE products
             SET is_active = 0
             WHERE id = ?
               AND is_active = 1
               AND is_variant = 1'
        );

        $statement->execute([$id]);

        if ($statement->rowCount() === 0) {
            respond([
                'ok' => false,
                'error' => 'Variant not found or already inactive.'
            ], 404);
        }

        respond([
            'ok' => true,
            'message' => 'Variant deactivated.'
        ]);

    } catch (InvalidArgumentException $error) {
        respond([
            'ok' => false,
            'error' => $error->getMessage()
        ], 422);
    }
}


// =========================
// UNSUPPORTED METHOD
// =========================

header('Allow: GET, POST, DELETE, OPTIONS');

respond([
    'ok' => false,
    'error' => 'Method not allowed.'
], 405);