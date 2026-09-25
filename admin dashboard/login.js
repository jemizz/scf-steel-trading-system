// =========================
// LOGIN FRONTEND
// =========================

document.addEventListener("DOMContentLoaded", function () {

    setupPasswordToggle();
    setupLoginForm();
    showLoginError();

});


// =========================
// SHOW / HIDE PASSWORD
// =========================

function setupPasswordToggle() {

    const passwordInput =
        document.getElementById("password");

    const passwordToggle =
        document.getElementById("passwordToggle");


    if (!passwordInput || !passwordToggle) {
        return;
    }


    passwordToggle.addEventListener("click", function () {

        const passwordIsHidden =
            passwordInput.type === "password";


        if (passwordIsHidden) {

            passwordInput.type = "text";

            passwordToggle.classList.add("showing");

            passwordToggle.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            passwordInput.type = "password";

            passwordToggle.classList.remove("showing");

            passwordToggle.setAttribute(
                "aria-label",
                "Show password"
            );

        }

    });

}


// =========================
// LOGIN FORM
// =========================

function setupLoginForm() {

    const loginForm =
        document.getElementById("loginForm");

    const usernameInput =
        document.getElementById("username");

    const passwordInput =
        document.getElementById("password");


    if (!loginForm) {
        return;
    }


    loginForm.addEventListener("submit", function (event) {

        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;


        // ==================================
        // CLEAR PREVIOUS ERROR STYLES
        // ==================================

        usernameInput.classList.remove("input-error");
        passwordInput.classList.remove("input-error");


        // ==================================
        // EMPTY USERNAME
        // ==================================

        if (username === "") {

            event.preventDefault();

            usernameInput.classList.add("input-error");

            usernameInput.focus();

            return;
        }


        // ==================================
        // EMPTY PASSWORD
        // ==================================

        if (password === "") {

            event.preventDefault();

            passwordInput.classList.add("input-error");

            passwordInput.focus();

            return;
        }


        // ==================================
        // IMPORTANT:
        // DO NOT PREVENT SUBMISSION
        // ==================================

        // The form will now continue to:
        // login.php

    });


    // ==================================
    // REMOVE RED ERROR WHEN USER TYPES
    // ==================================

    usernameInput.addEventListener("input", function () {

        usernameInput.classList.remove("input-error");

    });


    passwordInput.addEventListener("input", function () {

        passwordInput.classList.remove("input-error");

    });

}


// =========================
// SHOW SERVER ERROR
// =========================

function showLoginError() {

    const params =
        new URLSearchParams(window.location.search);

    const error =
        params.get("error");

    const remaining =
        params.get("remaining");

    const minutes =
        params.get("minutes");


    const message =
        document.getElementById("loginMessage");

    const usernameInput =
        document.getElementById("username");

    const passwordInput =
        document.getElementById("password");

    const loginButton =
        document.querySelector(".login-btn");


    if (!error) {
        return;
    }


    // ==================================
    // INVALID LOGIN
    // ==================================

    if (error === "invalid") {

        usernameInput.classList.add("input-error");
        passwordInput.classList.add("input-error");

        message.textContent =
            "Invalid email or password."
            + (remaining
                ? " " + remaining
                + " attempt"
                + (remaining == 1 ? "" : "s")
                + " remaining."
                : "");

        message.classList.add("show");

        return;
    }


    // ==================================
    // EMPTY FIELD
    // ==================================

    if (error === "empty") {

        message.textContent =
            "Please enter your email and password.";

        message.classList.add("show");

        usernameInput.classList.add("input-error");
        passwordInput.classList.add("input-error");

        return;
    }


    // ==================================
    // ACCOUNT LOCKED
    // ==================================

    if (error === "locked") {

        usernameInput.classList.add("input-error");
        passwordInput.classList.add("input-error");

        message.textContent =
            "Too many failed login attempts. "
            + "Please try again after "
            + minutes
            + " minute"
            + (minutes == 1 ? "" : "s")
            + ".";

        message.classList.add("show");

        if (loginButton) {
            loginButton.disabled = true;
        }

        usernameInput.disabled = true;
        passwordInput.disabled = true;

        return;
    }


    // ==================================
    // UNAUTHORIZED
    // ==================================

    if (error === "unauthorized") {

        usernameInput.classList.add("input-error");
        passwordInput.classList.add("input-error");

        message.textContent =
            "This account is not authorized to access the admin portal.";

        message.classList.add("show");

    }

}