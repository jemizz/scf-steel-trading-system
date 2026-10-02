<?php

ob_start();

header("Content-Type: application/json; charset=utf-8");

function send_json($success, $message, $extra = [])
{
    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode(array_merge([
        "success" => $success,
        "message" => $message
    ], $extra));

    exit;
}

set_exception_handler(function ($e) {
    send_json(false, "Server error: " . $e->getMessage());
});

register_shutdown_function(function () {
    $error = error_get_last();

    if (!$error) {
        return;
    }

    $fatalTypes = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR];

    if (!in_array($error["type"], $fatalTypes, true)) {
        return;
    }

    if (!headers_sent()) {
        header("Content-Type: application/json; charset=utf-8");
    }

    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $error["message"]
    ]);
});

$dbCandidates = [
    __DIR__ . "/db.php",
    __DIR__ . "/../db.php",
    __DIR__ . "/../admin dashboard/db.php"
];

$dbFile = null;

foreach ($dbCandidates as $candidate) {
    if (is_file($candidate)) {
        $dbFile = $candidate;
        break;
    }
}

if ($dbFile === null) {
    send_json(false, "db.php was not found beside messages.php.");
}

require_once $dbFile;

if (!isset($pdo) || !($pdo instanceof PDO)) {
    send_json(false, "Database connection failed. Check db.php — \$pdo is missing.");
}

function table_columns(PDO $pdo, $table)
{
    $stmt = $pdo->query("SHOW COLUMNS FROM `" . str_replace("`", "", $table) . "`");
    $columns = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $columns[] = $row["Field"];
    }

    return $columns;
}

function pick_column(array $columns, array $candidates)
{
    $lookup = [];

    foreach ($columns as $column) {
        $lookup[strtolower($column)] = $column;
    }

    foreach ($candidates as $candidate) {
        $key = strtolower($candidate);

        if (isset($lookup[$key])) {
            return $lookup[$key];
        }
    }

    return null;
}

function map_status($status)
{
    $value = strtolower(trim((string) $status));

    if ($value === "read") {
        return "read";
    }

    return "unread";
}

function row_value(array $row, $column)
{
    if ($column === null || !array_key_exists($column, $row)) {
        return "";
    }

    return $row[$column];
}

$columns = table_columns($pdo, "inquiries");

$idColumn = pick_column($columns, ["id", "inquiry_id", "enquiry_id", "message_id"]);
$nameColumn = pick_column($columns, ["name", "full_name", "customer_name"]);
$contactColumn = pick_column($columns, ["contact", "contact_no", "contact_number", "phone", "mobile"]);
$emailColumn = pick_column($columns, ["email", "email_address"]);
$messageColumn = pick_column($columns, ["message", "inquiry", "enquiry", "details"]);
$statusColumn = pick_column($columns, ["status"]);
$dateColumn = pick_column($columns, ["enquire_at", "created_at", "inquiry_date", "date", "created"]);
$timeColumn = pick_column($columns, ["time"]);

if ($idColumn === null) {
    send_json(false, "inquiries table has no id column.");
}

$action = $_POST["action"] ?? $_GET["action"] ?? "list";

if ($action === "list") {
    $orderColumn = $dateColumn ?: $idColumn;

    $stmt = $pdo->query(
        "SELECT * FROM inquiries ORDER BY `{$orderColumn}` DESC, `{$idColumn}` DESC"
    );

    $messages = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $createdAt = trim((string) row_value($row, $dateColumn));
        $time = trim((string) row_value($row, $timeColumn));

        if ($createdAt !== "" && $time !== "" && strlen($createdAt) <= 10) {
            $createdAt .= " " . $time;
        }

        $messages[] = [
            "id" => row_value($row, $idColumn),
            "created_at" => $createdAt,
            "name" => row_value($row, $nameColumn),
            "email" => row_value($row, $emailColumn),
            "phone" => row_value($row, $contactColumn),
            "message" => row_value($row, $messageColumn),
            "status" => map_status(row_value($row, $statusColumn))
        ];
    }

    send_json(true, "Inquiries loaded.", [
        "messages" => $messages
    ]);
}

if ($action === "set_status") {
    $id = trim($_POST["id"] ?? "");
    $status = map_status($_POST["status"] ?? "unread");

    if ($id === "" || $statusColumn === null) {
        send_json(false, "Unable to update status.");
    }

    $storedStatus = $status === "read" ? "Read" : "Pending";

    $stmt = $pdo->prepare(
        "UPDATE inquiries SET `{$statusColumn}` = :status WHERE `{$idColumn}` = :id"
    );
    $stmt->execute([
        ":status" => $storedStatus,
        ":id" => $id
    ]);

    send_json(true, "Status updated.", [
        "status" => $status
    ]);
}

if ($action === "delete") {
    $id = trim($_POST["id"] ?? "");

    if ($id === "") {
        send_json(false, "Missing inquiry id.");
    }

    $stmt = $pdo->prepare(
        "DELETE FROM inquiries WHERE `{$idColumn}` = :id"
    );
    $stmt->execute([
        ":id" => $id
    ]);

    send_json(true, "Inquiry deleted.");
}

if ($action === "clear_all") {
    $pdo->exec("DELETE FROM inquiries");
    send_json(true, "All inquiries deleted.");
}

send_json(false, "Unknown action.");