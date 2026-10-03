<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/db.php';

function respond(bool $success, string $message = '', array $extra = [], int $status = 200): never
{
    http_response_code($status);
    echo json_encode(
        array_merge(
            ['success' => $success, 'message' => $message],
            $extra
        ),
        JSON_UNESCAPED_SLASHES
    );
    exit;
}

function request_input(): array
{
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        $input = $_POST;
    }

    return $input;
}

// =========================
// PUBLIC CONTACT INFORMATION
// =========================

$action = $_GET['action'] ?? '';

if ($action === 'get_public_contact') {

    $stmt = $pdo->query(
        'SELECT contact_no, email, links
         FROM users
         WHERE contact_no IS NOT NULL
            OR email IS NOT NULL
            OR links IS NOT NULL
         ORDER BY id ASC
         LIMIT 1'
    );

    $contact = $stmt->fetch();

    if (!$contact) {
        respond(false, 'Contact information not found.', [], 404);
    }

    respond(true, '', [
        'contact' => [
            'contact_no' => $contact['contact_no'] ?? '',
            'email'      => $contact['email'] ?? '',
            'links'      => $contact['links'] ?? ''
        ]
    ]);
}

// login.php saves $_SESSION['user_id'] and $_SESSION['role'] after a successful login.
$userId = isset($_SESSION['user_id'])
    ? (int) $_SESSION['user_id']
    : 0;

$userRole = strtolower(
    trim((string) ($_SESSION['role'] ?? ''))
);

if (
    $userId <= 0 ||
    !in_array(
        $userRole,
        ['admin', 'administrator'],
        true
    )
) {
    respond(false, 'User session not found.', [], 401);
}
// =========================
// GET SIDEBAR ADMIN
// =========================

if ($action === 'get_sidebar_admin') {

    try {

        $stmt = $pdo->prepare(
            'SELECT username
             FROM users
             WHERE id = :id
             LIMIT 1'
        );

        $stmt->execute([
            'id' => $userId
        ]);

        $account = $stmt->fetch();

    } catch (PDOException $e) {

        respond(
            false,
            'Unable to load administrator information.',
            [],
            500
        );

    }

    if (!$account) {

        respond(
            false,
            'Administrator account not found.',
            [],
            404
        );

    }

    respond(
        true,
        '',
        [
            'username' => $account['username'] ?? ''
        ]
    );
}

// =========================
// NOTIFICATION SETTINGS
// =========================

// JSON key => database column
$notificationColumns = [
    'inquiries'   => 'inquiries',
    'lowStock'    => 'low_stock',
    'fabrication' => 'fabrication',
    'poDelivery'  => 'po_delivery',
    'dailySales'  => 'daily_sales'
];

// Customer inquiries are ON by default; the rest are OFF.
$notificationDefaults = [
    'inquiries'   => true,
    'lowStock'    => false,
    'fabrication' => false,
    'poDelivery'  => false,
    'dailySales'  => false
];

function ensure_notification_table(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS notification_settings (
            id          TINYINT UNSIGNED NOT NULL DEFAULT 1,
            inquiries   TINYINT(1) NOT NULL DEFAULT 1,
            low_stock   TINYINT(1) NOT NULL DEFAULT 0,
            fabrication TINYINT(1) NOT NULL DEFAULT 0,
            po_delivery TINYINT(1) NOT NULL DEFAULT 0,
            daily_sales TINYINT(1) NOT NULL DEFAULT 0,
            updated_at  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
}

if ($action === 'get_notification_settings') {

    try {
        ensure_notification_table($pdo);

        // Single admin -> one settings row (id = 1)
        $row = $pdo->query(
            'SELECT * FROM notification_settings
             WHERE id = 1
             LIMIT 1'
        )->fetch();
    } catch (PDOException $e) {
        respond(false, 'Unable to load notification settings.', [], 500);
    }

    $settings = [];

    foreach ($notificationColumns as $key => $column) {
        $settings[$key] = $row
            ? ((int) $row[$column] === 1)
            : $notificationDefaults[$key];
    }

    respond(true, '', ['settings' => $settings]);
}

if ($action === 'save_notification_settings') {

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(false, 'Invalid request method.', [], 405);
    }

    $input = request_input();
    $values = [];

    foreach ($notificationColumns as $key => $column) {
        $values[$column] = filter_var(
            $input[$key] ?? $notificationDefaults[$key],
            FILTER_VALIDATE_BOOLEAN
        ) ? 1 : 0;
    }

    try {
        ensure_notification_table($pdo);

        $stmt = $pdo->prepare(
            'INSERT INTO notification_settings
                (id, inquiries, low_stock, fabrication,
                 po_delivery, daily_sales)
             VALUES
                (1, :inquiries, :low_stock, :fabrication,
                 :po_delivery, :daily_sales)
             ON DUPLICATE KEY UPDATE
                inquiries   = VALUES(inquiries),
                low_stock   = VALUES(low_stock),
                fabrication = VALUES(fabrication),
                po_delivery = VALUES(po_delivery),
                daily_sales = VALUES(daily_sales)'
        );
        $stmt->execute($values);
    } catch (PDOException $e) {
        respond(false, 'Unable to save notification settings.', [], 500);
    }

    respond(true, 'Preferences saved.');
}

if ($action === 'get_account') {
    try {
        $stmt = $pdo->prepare(
            'SELECT id, username, contact_no, email, links, updated_at
             FROM users
             WHERE id = :id
             LIMIT 1'
        );
        $stmt->execute(['id' => $userId]);
        $account = $stmt->fetch();
    } catch (PDOException $e) {
        respond(false, 'Database is missing the "username" column. Import the updated scf_steel.sql.', [], 500);
    }

    if (!$account) {
        respond(false, 'User account not found.', [], 404);
    }

    respond(true, '', ['account' => $account]);
}

if ($action === 'update_account') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(false, 'Invalid request method.', [], 405);
    }

    $input = request_input();

    $adminUsername = trim((string) ($input['adminUsername'] ?? ''));
    $contactNumber = trim((string) ($input['contactNumber'] ?? ''));
    $emailAddress = trim((string) ($input['emailAddress'] ?? ''));
    $facebookLink = trim((string) ($input['facebookLink'] ?? ''));

    if ($adminUsername === '') {
        respond(false, 'Admin Username is required.', [], 422);
    }

    if (!preg_match('/^[A-Za-z0-9._-]{3,50}$/', $adminUsername)) {
        respond(false, 'Admin Username must be 3-50 characters: letters, numbers, dot, underscore, or dash.', [], 422);
    }

    if ($contactNumber === '') {
        respond(false, 'Contact number is required.', [], 422);
    }

    if (!preg_match('/^[0-9]{11}$/', $contactNumber)) {
        respond(false, 'Contact number must be exactly 11 digits.', [], 422);
    }

    if ($facebookLink === '') {
        respond(false, 'Facebook link is required.', [], 422);
    }

    if (strlen($facebookLink) > 255 || !filter_var($facebookLink, FILTER_VALIDATE_URL)) {
        respond(false, 'Please enter a valid Facebook link.', [], 422);
    }

    if ($emailAddress !== '') {
        if (strlen($emailAddress) > 150 || !filter_var($emailAddress, FILTER_VALIDATE_EMAIL)) {
            respond(false, 'Please enter a valid email address.', [], 422);
        }
    }

    $stmt = $pdo->prepare(
        'SELECT id
         FROM users
         WHERE username = :username
           AND id <> :id
         LIMIT 1'
    );
    $stmt->execute([
        'username' => $adminUsername,
        'id' => $userId
    ]);

    if ($stmt->fetch()) {
        respond(false, 'That Admin Username is already being used.', [], 409);
    }

    if ($emailAddress !== '') {
        $stmt = $pdo->prepare(
            'SELECT id
             FROM users
             WHERE email = :email
               AND id <> :id
             LIMIT 1'
        );
        $stmt->execute([
            'email' => $emailAddress,
            'id' => $userId
        ]);

        if ($stmt->fetch()) {
            respond(false, 'That email address is already being used.', [], 409);
        }
    }

    $stmt = $pdo->prepare(
        'UPDATE users
         SET username = :username,
             contact_no = :contact_no,
             email = :email,
             links = :links
         WHERE id = :id'
    );

    $stmt->execute([
        'username' => $adminUsername,
        'contact_no' => $contactNumber,
        'email' => $emailAddress !== '' ? $emailAddress : null,
        'links' => $facebookLink,
        'id' => $userId
    ]);

    $_SESSION['username'] = $adminUsername;

    respond(true, 'Changes saved successfully.');
}

if ($action === 'change_password') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(false, 'Invalid request method.', [], 405);
    }

    $input = request_input();

    $currentPassword = (string) ($input['currentPassword'] ?? '');
    $newPassword = (string) ($input['newPassword'] ?? '');
    $confirmPassword = (string) ($input['confirmPassword'] ?? '');

    if ($currentPassword === '') {
        respond(false, 'Current password is required.', [], 422);
    }

    if ($newPassword === '') {
        respond(false, 'New password is required.', [], 422);
    }

    if ($confirmPassword === '') {
        respond(false, 'Confirm password is required.', [], 422);
    }

    if ($newPassword !== $confirmPassword) {
        respond(false, 'Your new password and confirmation do not match.', [], 422);
    }

    if ($newPassword === $currentPassword) {
        respond(false, 'Please choose a password different from your current password.', [], 422);
    }

    $stmt = $pdo->prepare(
        'SELECT password
         FROM users
         WHERE id = :id
         LIMIT 1'
    );
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {
        respond(false, 'User account not found.', [], 404);
    }

    if (!password_verify($currentPassword, (string) $user['password'])) {
        respond(false, 'Current password is incorrect.', [], 422);
    }

    $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        'UPDATE users
         SET password = :password
         WHERE id = :id'
    );

    $stmt->execute([
        'password' => $newPasswordHash,
        'id' => $userId
    ]);

    respond(true, 'Password changed successfully.');
}


respond(false, 'Unknown action.', [], 400);