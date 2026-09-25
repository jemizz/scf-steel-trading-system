// =========================
// SETTINGS — FRONTEND ONLY
// =========================

(() => {
  "use strict";

  function initializeSettings() {
    const content = document.querySelector(".settings-content");

    if (!content || content.dataset.settingsInitialized === "true") {
      return;
    }

    content.dataset.settingsInitialized = "true";

    // =========================
    // PASSWORD VISIBILITY
    // =========================

    const eyeIcon = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;

    const eyeOffIcon = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3 3 18 18"></path>
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
        <path d="M9.9 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.1 4.1"></path>
        <path d="M6.2 6.2A19 19 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 5.8-1.8"></path>
      </svg>
    `;

    const passwordButtons = content.querySelectorAll(
      ".password-toggle"
    );

    function setPasswordVisibility(button, visible) {
      const input = document.getElementById(
        button.dataset.passwordTarget
      );

      if (!input) {
        return;
      }

      const label = input.labels?.[0]?.textContent.trim()
        || "password";

      input.type = visible ? "text" : "password";

      button.innerHTML = visible ? eyeOffIcon : eyeIcon;
      button.setAttribute("aria-pressed", String(visible));

      button.setAttribute(
        "aria-label",
        `${visible ? "Hide" : "Show"} ${label.toLowerCase()}`
      );
    }

    function hideAllPasswords() {
      passwordButtons.forEach((button) => {
        setPasswordVisibility(button, false);
      });
    }

    passwordButtons.forEach((button) => {
      setPasswordVisibility(button, false);

      button.addEventListener("click", () => {
        const isVisible =
          button.getAttribute("aria-pressed") === "true";

        setPasswordVisibility(button, !isVisible);
      });
    });

    // =========================
    // SETTINGS NAVIGATION
    // =========================

    const tabButtons = content.querySelectorAll(
      ".settings-tab-btn"
    );

    const panels = {
      account: document.getElementById("tab-account"),
      notification: document.getElementById("tab-notification")
    };

    function showTab(tabName) {
      if (!panels[tabName]) {
        return;
      }

      tabButtons.forEach((button) => {
        const isActive =
          button.dataset.settingsTab === tabName;

        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      Object.entries(panels).forEach(([name, panel]) => {
        if (panel) {
          panel.hidden = name !== tabName;
        }
      });

      if (tabName !== "account") {
        hideAllPasswords();
      }
    }

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        showTab(button.dataset.settingsTab);
      });
    });

    // =========================
    // CHANGE PASSWORD
    // =========================

    const passwordForm = document.getElementById(
      "changePasswordForm"
    );

    const currentPassword = document.getElementById(
      "currentPassword"
    );

    const newPassword = document.getElementById(
      "newPassword"
    );

    const confirmPassword = document.getElementById(
      "confirmPassword"
    );

    const passwordMessage = document.getElementById(
      "passwordMessage"
    );

    if (
      passwordForm &&
      currentPassword &&
      newPassword &&
      confirmPassword &&
      passwordMessage
    ) {
      function clearPasswordFeedback() {
        newPassword.setCustomValidity("");
        confirmPassword.setCustomValidity("");
        passwordMessage.textContent = "";
      }

      [
        currentPassword,
        newPassword,
        confirmPassword
      ].forEach((input) => {
        input.addEventListener("input", clearPasswordFeedback);
      });

      passwordForm.addEventListener("submit", (event) => {
        event.preventDefault();

        clearPasswordFeedback();

        if (!passwordForm.reportValidity()) {
          return;
        }

        if (newPassword.value === currentPassword.value) {
          newPassword.setCustomValidity(
            "Please choose a password different from your current password."
          );

          newPassword.reportValidity();
          return;
        }

        if (newPassword.value !== confirmPassword.value) {
          confirmPassword.setCustomValidity(
            "Your new password and confirmation do not match."
          );

          confirmPassword.reportValidity();
          return;
        }

        hideAllPasswords();

        /*
         * Future backend connection:
         * Submit the current and new passwords to your server.
         * The server must verify the current password and
         * enforce the password policy.
         *
         * Never log passwords or save them in localStorage.
         */

        passwordMessage.textContent =
          "The new password and confirmation match. " +
          "Your password has not been changed because " +
          "saving is not connected yet.";
      });

      passwordForm.addEventListener("reset", () => {
        clearPasswordFeedback();
        hideAllPasswords();
      });
    }

    // =========================
    // NOTIFICATION SETTINGS
    // =========================

    const notificationPanel = panels.notification;

    const saveNotificationButton = document.getElementById(
      "saveNotificationSettings"
    );

    const notificationMessage = document.getElementById(
      "notificationMessage"
    );

    if (
      notificationPanel &&
      saveNotificationButton &&
      notificationMessage
    ) {
      const notificationInputs = notificationPanel.querySelectorAll(
        'input[type="checkbox"]'
      );

      notificationInputs.forEach((input) => {
        input.addEventListener("change", () => {
          notificationMessage.textContent = "";
        });
      });

      saveNotificationButton.addEventListener("click", () => {
        /*
         * Future backend connection:
         * Read the notification checkboxes and submit their
         * checked values to your settings endpoint.
         */

        notificationMessage.textContent =
          "Your selections have not been saved because " +
          "saving is not connected yet.";
      });
    }

    // =========================
    // ACCOUNT FORM
    // =========================

    const accountForm = document.getElementById("accountForm");

    if (accountForm) {
      accountForm.addEventListener("submit", (event) => {
        // Prevent a page reload while this form is frontend-only.
        event.preventDefault();
      });
    }

    // =========================
    // INITIAL PANEL
    // =========================

    showTab("account");
  }

  // Works whether the script loads before or after DOMContentLoaded.
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeSettings,
      { once: true }
    );
  } else {
    initializeSettings();
  }
})();