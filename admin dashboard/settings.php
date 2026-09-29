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
$userId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;

if ($userId <= 0 || ($_SESSION['role'] ?? '') !== 'Admin') {
    respond(false, 'User session not found.', [], 401);
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

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }

    $adminUsername = trim((string) ($input['adminUsername'] ?? ''));
    $contactNumber = trim((string) ($input['contactNumber'] ?? ''));
    $emailAddress = trim((string) ($input['emailAddress'] ?? ''));
    $facebookLink = trim((string) ($input['facebookLink'] ?? ''));

    if (!preg_match('/^[A-Za-z0-9._-]{3,50}$/', $adminUsername)) {
        respond(false, 'Admin Username must be 3-50 characters (letters, numbers, dot, underscore, dash).', [], 422);
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

    if ($contactNumber !== '' && !preg_match('/^[0-9]{11}$/', $contactNumber)) {
        respond(false, 'Contact number must be exactly 11 digits.', [], 422);
    }

    if ($emailAddress !== '' && !filter_var($emailAddress, FILTER_VALIDATE_EMAIL)) {
        respond(false, 'Please enter a valid email address.', [], 422);
    }

    if ($facebookLink !== '' && !filter_var($facebookLink, FILTER_VALIDATE_URL)) {
        respond(false, 'Please enter a valid Facebook link.', [], 422);
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
        'contact_no' => $contactNumber !== '' ? $contactNumber : null,
        'email' => $emailAddress !== '' ? $emailAddress : null,
        'links' => $facebookLink !== '' ? $facebookLink : null,
        'id' => $userId
    ]);

    $_SESSION['username'] = $adminUsername;

    respond(true, 'Changes saved successfully.');
}

if ($action === 'change_password') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(false, 'Invalid request method.', [], 405);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }

    $currentPassword = (string) ($input['currentPassword'] ?? '');
    $newPassword = (string) ($input['newPassword'] ?? '');
    $confirmPassword = (string) ($input['confirmPassword'] ?? '');

    if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
        respond(false, 'Please complete all password fields.', [], 422);
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