// =========================
// LOGIN FRONTEND
// =========================

document.addEventListener("DOMContentLoaded", function () {

    setupPasswordToggle();
    setupLoginForm();

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


    if (!loginForm) {
        return;
    }


    loginForm.addEventListener("submit", function (event) {

        /*
            FRONTEND ONLY

            Prevent normal form submission.

            Later, this is where we will send
            the username and password to PHP
            and verify the administrator
            account from the database.
        */

        event.preventDefault();


        console.log(
            "Login form submitted."
        );

    });

}