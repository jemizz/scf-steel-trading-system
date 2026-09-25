<?php

session_start();

require_once "db.php";


// ==========================================
// ONLY ALLOW POST REQUEST
// ==========================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: login.html");
    exit;
}


// ==========================================
// GET LOGIN DATA
// ==========================================

$username = trim($_POST["username"] ?? "");
$password = $_POST["password"] ?? "";


// ==========================================
// BASIC VALIDATION
// ==========================================

if ($username === "" || $password === "") {
    header("Location: login.html?error=empty");
    exit;
}


// ==========================================
// GET USER IP
// ==========================================

$ipAddress = $_SERVER["REMOTE_ADDR"] ?? "unknown";


// ==========================================
// CHECK EXISTING LOGIN ATTEMPT RECORD
// ==========================================

$stmt = $pdo->prepare("
    SELECT
        failed_attempts,
        lockout_level,
        lockout_until
    FROM login_attempts
    WHERE email = ?
      AND ip_address = ?
    LIMIT 1
");

$stmt->execute([
    $username,
    $ipAddress
]);

$attemptData = $stmt->fetch();


// ==========================================
// CHECK IF CURRENTLY LOCKED
// ==========================================

if ($attemptData && $attemptData["lockout_until"] !== null) {

    $lockoutUntil = strtotime($attemptData["lockout_until"]);
    $currentTime = time();

    if ($lockoutUntil > $currentTime) {

        $remainingSeconds = $lockoutUntil - $currentTime;

        $remainingMinutes = ceil($remainingSeconds / 60);

        header(
            "Location: login.html?error=locked&minutes="
            . $remainingMinutes
        );

        exit;
    }

    // ======================================
    // LOCKOUT HAS EXPIRED
    // ======================================

    $stmt = $pdo->prepare("
        UPDATE login_attempts
        SET
            failed_attempts = 0,
            lockout_until = NULL,
            last_attempt = NOW()
        WHERE email = ?
          AND ip_address = ?
    ");

    $stmt->execute([
        $username,
        $ipAddress
    ]);

    $attemptData["failed_attempts"] = 0;
}


// ==========================================
// FIND USER
// ==========================================

$stmt = $pdo->prepare("
    SELECT
        id,
        first_name,
        last_name,
        email,
        password,
        role
    FROM users
    WHERE email = ?
    LIMIT 1
");

$stmt->execute([$username]);

$user = $stmt->fetch();


// ==========================================
// VERIFY PASSWORD
// ==========================================

if (!$user || !password_verify($password, $user["password"])) {

    // ======================================
    // GET CURRENT FAILED ATTEMPTS
    // ======================================

    $failedAttempts = 0;
    $lockoutLevel = 0;

    if ($attemptData) {
        $failedAttempts = (int)$attemptData["failed_attempts"];
        $lockoutLevel = (int)$attemptData["lockout_level"];
    }

    $failedAttempts++;

    
    // ======================================
    // CHECK IF 3 ATTEMPTS REACHED
    // ======================================

    if ($failedAttempts >= 3) {

        // Increase lockout level
        $lockoutLevel++;

        // First lock = 5 minutes
        // Second lock = 10 minutes
        // Third lock = 15 minutes
        // etc.
        $lockoutMinutes = $lockoutLevel * 5;

        $lockoutUntil = date(
            "Y-m-d H:i:s",
            time() + ($lockoutMinutes * 60)
        );


        // ==================================
        // SAVE LOCKOUT
        // ==================================

        $stmt = $pdo->prepare("
            INSERT INTO login_attempts
            (
                email,
                ip_address,
                failed_attempts,
                lockout_level,
                lockout_until,
                last_attempt
            )
            VALUES
            (
                ?,
                ?,
                0,
                ?,
                ?,
                NOW()
            )
            ON DUPLICATE KEY UPDATE
                failed_attempts = 0,
                lockout_level = VALUES(lockout_level),
                lockout_until = VALUES(lockout_until),
                last_attempt = NOW()
        ");

        $stmt->execute([
            $username,
            $ipAddress,
            $lockoutLevel,
            $lockoutUntil
        ]);


        header(
            "Location: login.html?error=locked&minutes="
            . $lockoutMinutes
        );

        exit;
    }


    // ======================================
    // SAVE FAILED ATTEMPT
    // ======================================

    $stmt = $pdo->prepare("
        INSERT INTO login_attempts
        (
            email,
            ip_address,
            failed_attempts,
            lockout_level,
            lockout_until,
            last_attempt
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            NULL,
            NOW()
        )
        ON DUPLICATE KEY UPDATE
            failed_attempts = VALUES(failed_attempts),
            last_attempt = NOW()
    ");

    $stmt->execute([
        $username,
        $ipAddress,
        $failedAttempts,
        $lockoutLevel
    ]);


    $remainingAttempts = 3 - $failedAttempts;

    header(
        "Location: login.html?error=invalid&remaining="
        . $remainingAttempts
    );

    exit;
}


// ==========================================
// ADMIN ONLY
// ==========================================

if ($user["role"] !== "Admin") {

    header("Location: login.html?error=unauthorized");
    exit;
}


// ==========================================
// SUCCESSFUL LOGIN
// ==========================================

// Reset failed attempts after successful login

$stmt = $pdo->prepare("
    DELETE FROM login_attempts
    WHERE email = ?
      AND ip_address = ?
");

$stmt->execute([
    $username,
    $ipAddress
]);


// ==========================================
// REGENERATE SESSION ID
// ==========================================

session_regenerate_id(true);


// ==========================================
// SAVE USER SESSION
// ==========================================

$_SESSION["user_id"] = $user["id"];
$_SESSION["first_name"] = $user["first_name"];
$_SESSION["last_name"] = $user["last_name"];
$_SESSION["email"] = $user["email"];
$_SESSION["role"] = $user["role"];


// ==========================================
// REDIRECT TO DASHBOARD
// ==========================================

header("Location: dashboard.html");
exit;