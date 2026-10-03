<?php

header('Content-Type: application/json; charset=utf-8');

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$name = 'scf_steel';

$conn = null;

foreach (['db.php', 'config.php', 'connection.php', 'database.php'] as $file) {
    $path = __DIR__ . '/' . $file;

    if (is_file($path)) {
        require_once $path;
        break;
    }
}

if (isset($con) && $con instanceof mysqli) {
    $conn = $con;
}

if (!$conn instanceof mysqli) {
    $conn = @new mysqli($host, $user, $pass, $name);
}

if (!$conn instanceof mysqli || $conn->connect_error) {
    echo json_encode([
        'ok' => false,
        'error' => 'Database connection failed. Check host, user, password, and database name in inventory.php.'
    ]);
    exit;
}

$conn->set_charset('utf8mb4');

$sql = "
    SELECT
        id,
        catalog,
        name,
        dimensions,
        size,
        thickness,
        kilos,
        gauge,
        color,
        variant,
        brand,
        price_unit,
        stock_quantity,
        minimum_stock
    FROM products
    WHERE is_active = 1
    ORDER BY catalog, name, id
";

$result = $conn->query($sql);

if (!$result) {
    echo json_encode([
        'ok' => false,
        'error' => 'Could not read products: ' . $conn->error
    ]);
    exit;
}

$categories = [
    'Steel Products' => 'Steel Products',
    'Roofing Materials' => 'Roofing Materials',
    'Stainless Products' => 'Stainless Materials',
    'Stainless Materials' => 'Stainless Materials',
    'Hardware Items' => 'Hardware Items'
];

$items = [];

while ($row = $result->fetch_assoc()) {
    $specs = [];

    foreach (['dimensions', 'size', 'thickness', 'kilos', 'gauge', 'color', 'variant', 'brand', 'price_unit'] as $field) {
        $value = trim((string) ($row[$field] ?? ''));

        if ($value !== '' && !in_array($value, $specs, true)) {
            $specs[] = $value;
        }
    }

    $catalog = $row['catalog'] ?? '';
    $id = (int) $row['id'];

    $items[] = [
        'productId' => sprintf('PRD-%03d', $id),
        'dbId' => $id,
        'productName' => $row['name'],
        'spec' => implode(' · ', array_slice($specs, 0, 4)),
        'category' => $categories[$catalog] ?? $catalog,
        'stock' => (int) $row['stock_quantity'],
        'minimumStock' => (int) $row['minimum_stock']
    ];
}

echo json_encode([
    'ok' => true,
    'count' => count($items),
    'items' => $items
]);
