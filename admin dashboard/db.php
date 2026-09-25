<?php

// ================================
// DATABASE CONFIGURATION
// ================================

$host = "localhost";
$dbname = "scf_steel";
$username = "root";
$password = "";


// ================================
// SECURE PDO CONNECTION
// ================================

try {

    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false
        ]
    );

} catch (PDOException $e) {

    // Do NOT expose the actual database error to users.
    error_log("Database connection error: " . $e->getMessage());

    http_response_code(500);
    exit("A database connection error occurred.");

}