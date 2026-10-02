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

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    send_json(false, "Invalid request method.");
}

$dbCandidates = [
    __DIR__ . "/db.php",
    __DIR__ . "/../db.php",
    __DIR__ . "/../admin dashboard/db.php",
    __DIR__ . "/admin dashboard/db.php"
];

$dbFile = null;

foreach ($dbCandidates as $candidate) {
    if (is_file($candidate)) {
        $dbFile = $candidate;
        break;
    }
}

if ($dbFile === null) {
    send_json(false, "db.php was not found. Put it in the same folder as contact.php.");
}

require_once $dbFile;

if (!isset($pdo) || !($pdo instanceof PDO)) {
    send_json(false, "Database connection failed. Check db.php — \$pdo is missing.");
}

$name = trim($_POST["name"] ?? "");
$contact = trim($_POST["contact"] ?? "");
$email = trim($_POST["email"] ?? "");
$message = trim($_POST["message"] ?? "");

if ($name === "" || $contact === "" || $email === "" || $message === "") {
    send_json(false, "Please complete all required fields.");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(false, "Please enter a valid email address.");
}

if (strlen($name) > 150 || strlen($contact) > 30 || strlen($email) > 150) {
    send_json(false, "One of the fields is too long.");
}

try {
    date_default_timezone_set("Asia/Manila");

    $status = "Pending";
    $time = date("H:i:s");
    $enquire_at = date("Y-m-d H:i:s");

    $savedWithEmail = true;

    try {
        $sql = "
            INSERT INTO inquiries
            (
                name,
                contact,
                email,
                message,
                status,
                time,
                enquire_at
            )
            VALUES
            (
                :name,
                :contact,
                :email,
                :message,
                :status,
                :time,
                :enquire_at
            )
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":name" => $name,
            ":contact" => $contact,
            ":email" => $email,
            ":message" => $message,
            ":status" => $status,
            ":time" => $time,
            ":enquire_at" => $enquire_at
        ]);
    } catch (PDOException $e) {
        $dbMessage = $e->getMessage();
        $missingEmail = stripos($dbMessage, "Unknown column") !== false
            && stripos($dbMessage, "email") !== false;

        if (!$missingEmail) {
            throw $e;
        }

        $savedWithEmail = false;

        $sql = "
            INSERT INTO inquiries
            (
                name,
                contact,
                message,
                status,
                time,
                enquire_at
            )
            VALUES
            (
                :name,
                :contact,
                :message,
                :status,
                :time,
                :enquire_at
            )
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":name" => $name,
            ":contact" => $contact,
            ":message" => $message,
            ":status" => $status,
            ":time" => $time,
            ":enquire_at" => $enquire_at
        ]);
    }

    send_json(
        true,
        $savedWithEmail
            ? "Inquiry submitted successfully."
            : "Inquiry submitted. Email was not saved because the inquiries table has no email column."
    );
} catch (PDOException $e) {
    send_json(false, "Database error: " . $e->getMessage());
}