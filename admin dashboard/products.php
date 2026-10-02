<?php
/**
 * Products API
 * GET    /api/products.php            list rows (admin)
 * GET    /api/products.php?grouped=1  one group per category + product name
 * GET    /api/products.php?id=12      one row + sibling variants
 * POST   /api/products.php            add product + variants (multipart)
 * POST   /api/products.php?action=update-variant  edit one specification (JSON)
 * POST   /api/products.php?action=deactivate-group deactivate a product group (JSON)
 * DELETE /api/products.php?id=12      deactivate a row
 */
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
require __DIR__ . '/db.php';
function catalog_label(string $catalog): string
{
    return $catalog === 'Hardware Items' ? 'Hardware Materials' : $catalog;
}
function spec_of(array $row): string
{
    $parts = array_filter([
        $row['dimensions'] ?? null,
        $row['size'] ?? null,
        $row['thickness'] ?? null,
        $row['gauge'] ?? null,
        $row['kilos'] ?? null,
        $row['grade'] ?? null,
        $row['color'] ?? null,
        $row['variant'] ?? null,
        $row['brand'] ?? null,
    ], static fn($value) => $value !== null && $value !== '');
    return implode(' · ', array_unique($parts));
}
function map_row(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'category_id' => (int) $row['category_id'],
        'category' => $row['category_name'] ?? '',
        'catalog' => $row['catalog'] ?? '',
        'catalog_label' => catalog_label((string) ($row['catalog'] ?? '')),
        'name' => $row['name'],
        'spec' => spec_of($row),
        'dimensions' => $row['dimensions'],
        'size' => $row['size'],
        'thickness' => $row['thickness'],
        'color' => $row['color'],
        'price' => $row['price'] !== null ? (float) $row['price'] : null,
        'price_unit' => $row['price_unit'],
        'price_half' => $row['price_half'] !== null ? (float) $row['price_half'] : null,
        'price_quarter' => $row['price_quarter'] !== null ? (float) $row['price_quarter'] : null,
        'gauge' => $row['gauge'],
        'kilos' => $row['kilos'],
        'grade' => $row['grade'],
        'variant' => $row['variant'],
        'brand' => $row['brand'],
        'notes' => $row['notes'],
        'price_per_ft' => $row['price_per_ft'] !== null ? (float) $row['price_per_ft'] : null,
        'description' => $row['description'],
        'image' => $row['image_path'],
        'is_active' => (int) $row['is_active'],
    ];
}
$select = "
    SELECT
        p.*,
        c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
";
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    if (!empty($_GET['id'])) {
        $statement = $pdo->prepare($select . ' WHERE p.id = ? LIMIT 1');
        $statement->execute([(int) $_GET['id']]);
        $row = $statement->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'Product not found.']);
            exit;
        }
        $siblings = $pdo->prepare(
            $select . ' WHERE p.name = ? AND p.category_id = ? AND p.is_active = 1 ORDER BY p.id'
        );
        $siblings->execute([$row['name'], $row['category_id']]);
        echo json_encode([
            'ok' => true,
            'product' => map_row($row),
            'variants' => array_map('map_row', $siblings->fetchAll()),
        ]);
        exit;
    }
    $rows = $pdo->query($select . ' WHERE p.is_active = 1 ORDER BY p.id')->fetchAll();
    $products = array_map('map_row', $rows);
    $categories = $pdo->query(
        'SELECT id, name, parent_id, sort_order FROM categories ORDER BY sort_order, name'
    )->fetchAll();
    if (!empty($_GET['grouped'])) {
        $groups = [];
        foreach ($products as $product) {
            $key = json_encode([$product['category_id'], $product['name']]);
            if (!isset($groups[$key])) {
                $groups[$key] = [
                    'id' => $product['id'], // Representative variant ID, not a parent product ID.
                    'category_id' => $product['category_id'],
                    'name' => $product['name'],
                    'catalog' => $product['catalog'],
                    'catalog_label' => $product['catalog_label'],
                    'category' => $product['category'],
                    'image' => $product['image'],
                    'description' => $product['description'],
                    'price' => $product['price'],
                    'price_unit' => $product['price_unit'],
                    'variant_count' => 0,
                    'variants' => [],
                ];
            }
            $groups[$key]['variant_count']++;
            $groups[$key]['variants'][] = $product;
            if ($product['price'] !== null && (
                $groups[$key]['price'] === null || $product['price'] < $groups[$key]['price']
            )) {
                $groups[$key]['price'] = $product['price'];
                $groups[$key]['price_unit'] = $product['price_unit'];
            }
            if (!$groups[$key]['image'] && $product['image']) {
                $groups[$key]['image'] = $product['image'];
            }
        }
        echo json_encode([
            'ok' => true,
            'source' => 'database',
            'categories' => $categories,
            'products' => array_values($groups),
        ]);
        exit;
    }
    echo json_encode([
        'ok' => true,
        'source' => 'database',
        'categories' => $categories,
        'products' => $products,
    ]);
    exit;
}
// Manage existing variants. The original multipart Add Product handler stays below.
if ($method === 'POST' && isset($_GET['action'])) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'Invalid request.']);
        exit;
    }

    try {
        $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
        if (!$id || $id < 1) {
            throw new InvalidArgumentException('A valid record ID is required.');
        }

        if ($_GET['action'] === 'update-variant') {
            $limits = [
                'dimensions' => 80, 'size' => 80, 'thickness' => 30,
                'kilos' => 30, 'gauge' => 20, 'color' => 30,
                'grade' => 20, 'variant' => 60, 'brand' => 60,
                'price_unit' => 20,
            ];
            $prices = ['price', 'price_half', 'price_quarter', 'price_per_ft'];
            $changes = [];
            $values = [];

            foreach (array_merge(array_keys($limits), $prices) as $field) {
                if (!array_key_exists($field, $input)) continue;
                if ($input[$field] !== null && !is_scalar($input[$field])) {
                    throw new InvalidArgumentException('Invalid field value.');
                }
                $value = trim((string) ($input[$field] ?? ''));
                if (in_array($field, $prices, true)) {
                    if ($value !== '' && (!preg_match('/^\d{1,8}(\.\d{1,2})?$/D', $value))) {
                        throw new InvalidArgumentException('Prices must be nonnegative with at most two decimal places.');
                    }
                } elseif (preg_match_all('/./us', $value) > $limits[$field]) {
                    throw new InvalidArgumentException($field . ' is too long.');
                }
                // Field names come exclusively from the whitelist above.
                $changes[] = '`' . $field . '` = ?';
                $values[] = $value === '' ? null : $value;
            }
            if (!$changes) throw new InvalidArgumentException('No changes supplied.');

            $pdo->beginTransaction();
            $check = $pdo->prepare('SELECT id FROM products WHERE id = ? AND is_active = 1 FOR UPDATE');
            $check->execute([$id]);
            if (!$check->fetch()) throw new InvalidArgumentException('This record is no longer active. Refresh the page.');
            $values[] = $id;
            $update = $pdo->prepare('UPDATE products SET ' . implode(', ', $changes) . ' WHERE id = ?');
            $update->execute($values);
            $pdo->commit();
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($_GET['action'] === 'deactivate-group') {
            $pdo->beginTransaction();
            $lookup = $pdo->prepare('SELECT name, category_id FROM products WHERE id = ? AND is_active = 1 FOR UPDATE');
            $lookup->execute([$id]);
            $group = $lookup->fetch();
            if (!$group) throw new InvalidArgumentException('This product is no longer active. Refresh the page.');
            // Check the name/category shown in the confirmation, in case it changed.
            if (($input['name'] ?? '') !== $group['name'] || (int) ($input['category_id'] ?? 0) !== (int) $group['category_id']) {
                throw new InvalidArgumentException('The product changed. Refresh before deleting.');
            }
            $delete = $pdo->prepare('UPDATE products SET is_active = 0 WHERE name = ? AND category_id = ? AND is_active = 1');
            $delete->execute([$group['name'], $group['category_id']]);
            $count = $delete->rowCount();
            $pdo->commit();
            echo json_encode(['ok' => true, 'affected' => $count]);
            exit;
        }
        throw new InvalidArgumentException('Unknown action.');
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        $validation = $error instanceof InvalidArgumentException;
        http_response_code($validation ? 422 : 500);
        if (!$validation) error_log((string) $error);
        echo json_encode(['ok' => false, 'error' => $validation ? $error->getMessage() : 'Could not save the change.']);
        exit;
    }
}

if ($method === 'POST') {
    $name = trim((string) ($_POST['name'] ?? ''));
    $categoryId = (int) ($_POST['category_id'] ?? 0);
    $description = trim((string) ($_POST['description'] ?? ''));
    $showInCatalog = 1; // laging active para lumabas agad sa Products table
    $variants = json_decode((string) ($_POST['variants'] ?? '[]'), true);
    if ($name === '' || $categoryId <= 0 || !is_array($variants) || count($variants) === 0) {
        http_response_code(422);
        echo json_encode([
            'ok' => false,
            'error' => 'Product name, subcategory, and at least one variant are required.',
        ]);
        exit;
    }
    $category = $pdo->prepare(
        'SELECT c.id, c.name, c.parent_id, p.name AS parent_name
         FROM categories c
         LEFT JOIN categories p ON p.id = c.parent_id
         WHERE c.id = ?'
    );
    $category->execute([$categoryId]);
    $categoryRow = $category->fetch();
    if (!$categoryRow) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'Selected category does not exist.']);
        exit;
    }
    $catalog = $categoryRow['parent_name'] ?: $categoryRow['name'];
    $imagePath = null;
    if (!empty($_FILES['image']['name']) && (int) $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $allowed = [
            'image/png' => 'png',
            'image/jpeg' => 'jpg',
            'image/webp' => 'webp',
        ];
        $mime = mime_content_type($_FILES['image']['tmp_name']) ?: '';
        if (!isset($allowed[$mime]) || (int) $_FILES['image']['size'] > 2 * 1024 * 1024) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'error' => 'Image must be PNG, JPG, or WebP up to 2 MB.']);
            exit;
        }
        $folder = dirname(__DIR__) . '/uploads/products';
        if (!is_dir($folder)) {
            mkdir($folder, 0775, true);
        }
        $filename = 'product-' . date('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.' . $allowed[$mime];
        $destination = $folder . '/' . $filename;
        if (!move_uploaded_file($_FILES['image']['tmp_name'], $destination)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Could not save the product image.']);
            exit;
        }
        $imagePath = 'uploads/products/' . $filename;
    }
    $insert = $pdo->prepare(
        'INSERT INTO products
            (category_id, catalog, name, dimensions, size, price, price_unit, variant, description, notes, image_path, is_active)
         VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $pdo->beginTransaction();
    $created = [];
    try {
        foreach ($variants as $variant) {
            $spec = trim((string) ($variant['spec'] ?? ''));
            $unit = trim((string) ($variant['unit'] ?? 'pc')) ?: 'pc';
            $price = $variant['price'] ?? null;
            $sku = trim((string) ($variant['sku'] ?? ''));
            $minStock = (int) ($variant['min_stock'] ?? 0);
            if ($spec === '' || $price === null || $price === '' || !is_numeric($price)) {
                throw new RuntimeException('Each variant needs a specification and a price.');
            }
            $insert->execute([
                $categoryId,
                $catalog,
                $name,
                $spec,
                $spec,
                number_format((float) $price, 2, '.', ''),
                $unit,
                $sku !== '' ? $sku : null,
                $description !== '' ? $description : null,
                $minStock > 0 ? 'min_stock:' . $minStock : null,
                $imagePath,
                $showInCatalog,
            ]);
            $created[] = (int) $pdo->lastInsertId();
        }
        $pdo->commit();
    } catch (Throwable $error) {
        $pdo->rollBack();
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => $error->getMessage()]);
        exit;
    }
    echo json_encode([
        'ok' => true,
        'ids' => $created,
        'message' => count($created) . ' variant' . (count($created) === 1 ? '' : 's') . ' saved.',
    ]);
    exit;
}
if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'Missing product id.']);
        exit;
    }
    $statement = $pdo->prepare('UPDATE products SET is_active = 0 WHERE id = ?');
    $statement->execute([$id]);
    echo json_encode(['ok' => true]);
    exit;
}
http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'Method not allowed.']);