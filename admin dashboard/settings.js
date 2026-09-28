```javascript
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

    // Small helper for consistent disable/enable
    const setDisabled = (btn, disabled) => {
      if (!btn) return;

      btn.disabled = disabled;

      if (disabled) {
        btn.setAttribute("disabled", "");
      } else {
        btn.removeAttribute("disabled");
      }
    };

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

    const passwordButtons = content.querySelectorAll(".password-toggle");

    function setPasswordVisibility(button, visible) {
      const input = document.getElementById(button.dataset.passwordTarget);

      if (!input) return;

      const label =
        input.labels?.[0]?.textContent.trim() || "password";

      input.type = visible ? "text" : "password";

      button.innerHTML = visible ? eyeOffIcon : eyeIcon;

      button.setAttribute(
        "aria-pressed",
        String(visible)
      );

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

    const tabButtons =
      content.querySelectorAll(".settings-tab-btn");

    const panels = {
      account: document.getElementById("tab-account"),
      notification: document.getElementById("tab-notification")
    };

    function showTab(tabName) {
      if (!panels[tabName]) return;

      tabButtons.forEach((button) => {
        const isActive =
          button.dataset.settingsTab === tabName;

        button.classList.toggle("active", isActive);

        button.setAttribute(
          "aria-pressed",
          String(isActive)
        );
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
    // Enable button ONLY when
    // ALL 3 fields are filled
    // =========================

    const passwordForm =
      document.getElementById("changePasswordForm");

    const currentPassword =
      document.getElementById("currentPassword");

    const newPassword =
      document.getElementById("newPassword");

    const confirmPassword =
      document.getElementById("confirmPassword");

    const passwordMessage =
      document.getElementById("passwordMessage");

    const changePasswordBtn =
      document.getElementById("changePasswordBtn");

    if (
      passwordForm &&
      currentPassword &&
      newPassword &&
      confirmPassword &&
      passwordMessage &&
      changePasswordBtn
    ) {
      function clearPasswordFeedback() {
        newPassword.setCustomValidity("");
        confirmPassword.setCustomValidity("");
        passwordMessage.textContent = "";
      }

      function updateChangePasswordBtnState() {
        const allFilled =
          currentPassword.value.trim() !== "" &&
          newPassword.value.trim() !== "" &&
          confirmPassword.value.trim() !== "";

        setDisabled(
          changePasswordBtn,
          !allFilled
        );
      }

      // Initial state
      updateChangePasswordBtnState();

      [
        currentPassword,
        newPassword,
        confirmPassword
      ].forEach((input) => {
        input.addEventListener("input", () => {
          clearPasswordFeedback();
          updateChangePasswordBtnState();
        });
      });

      passwordForm.addEventListener("submit", (event) => {
        event.preventDefault();

        clearPasswordFeedback();

        // Ignore submit while disabled
        if (changePasswordBtn.disabled) {
          return;
        }

        if (!passwordForm.reportValidity()) {
          return;
        }

        if (
          newPassword.value ===
          currentPassword.value
        ) {
          newPassword.setCustomValidity(
            "Please choose a password different from your current password."
          );

          newPassword.reportValidity();

          return;
        }

        if (
          newPassword.value !==
          confirmPassword.value
        ) {
          confirmPassword.setCustomValidity(
            "Your new password and confirmation do not match."
          );

          confirmPassword.reportValidity();

          return;
        }

        hideAllPasswords();

        // =========================
        // SAVE NEW PASSWORD
        // =========================

        fetch(
          "settings.php?action=change_password",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              currentPassword:
                currentPassword.value,

              newPassword:
                newPassword.value,

              confirmPassword:
                confirmPassword.value
            })
          }
        )
          .then(async (response) => {
            const data =
              await response.json()
                .catch(() => ({}));

            if (
              !response.ok ||
              !data.success
            ) {
              throw new Error(
                data.message ||
                "Unable to change password."
              );
            }

            return data;
          })

          .then((data) => {
            passwordMessage.textContent =
              data.message;

            passwordForm.reset();

            hideAllPasswords();

            updateChangePasswordBtnState();
          })

          .catch((error) => {
            passwordMessage.textContent =
              error.message;

            updateChangePasswordBtnState();
          });
      });

      passwordForm.addEventListener(
        "reset",
        () => {
          clearPasswordFeedback();

          hideAllPasswords();

          setTimeout(() => {
            updateChangePasswordBtnState();
          }, 0);
        }
      );
    }

    // =========================
    // NOTIFICATION SETTINGS
    // =========================

    const notificationPanel =
      panels.notification;

    const saveNotificationButton =
      document.getElementById(
        "saveNotificationSettings"
      );

    const notificationMessage =
      document.getElementById(
        "notificationMessage"
      );

    if (
      notificationPanel &&
      saveNotificationButton &&
      notificationMessage
    ) {
      const notificationInputs =
        notificationPanel.querySelectorAll(
          'input[type="checkbox"]'
        );

      notificationInputs.forEach((input) => {
        input.addEventListener("change", () => {
          notificationMessage.textContent = "";
        });
      });

      saveNotificationButton.addEventListener(
        "click",
        () => {
          notificationMessage.textContent =
            "Your selections have not been saved because " +
            "saving is not connected yet.";
        }
      );
    }

    // =========================
    // ACCOUNT FORM
    // Confirm enables ONLY when user changes:
    // contactNumber / facebookLink / emailAddress
    // =========================

    const accountForm =
      document.getElementById("accountForm");

    if (accountForm) {
      const contactNumber =
        document.getElementById("contactNumber");

      const facebookLink =
        document.getElementById("facebookLink");

      const emailAddress =
        document.getElementById("emailAddress");

      const confirmBtn =
        document.getElementById("accountConfirmBtn");

      const accountMessage =
        document.getElementById("accountMessage");

      const inputs = [
        contactNumber,
        facebookLink,
        emailAddress
      ].filter(Boolean);

      const normalize = (el) => {
        if (!el) return "";

        if (el.id === "contactNumber") {
          return el.value
            .replace(/\D/g, "");
        }

        return el.value.trim();
      };

      // Always start disabled
      setDisabled(confirmBtn, true);

      // Original values
      const initialValues = new Map();

      let userArmed = false;

      const captureBaseline = () => {
        initialValues.clear();

        inputs.forEach((el) => {
          initialValues.set(
            el.id,
            normalize(el)
          );
        });

        setDisabled(confirmBtn, true);
      };

      const hasChanges = () => {
        return inputs.some((el) => {
          return (
            normalize(el) !==
            initialValues.get(el.id)
          );
        });
      };

      const updateConfirmState = () => {
        if (!userArmed) {
          setDisabled(confirmBtn, true);
          return;
        }

        setDisabled(
          confirmBtn,
          !hasChanges()
        );

        if (accountMessage) {
          accountMessage.textContent = "";
        }
      };

      const armUser = () => {
        if (userArmed) return;

        userArmed = true;

        /*
         * Do NOT recapture the baseline here.
         * The baseline should remain the values
         * loaded from the database.
         */
        updateConfirmState();
      };

      // =========================
      // INITIAL BASELINE
      // =========================

      const baselineAfterLoad = () => {
        captureBaseline();
        userArmed = false;
      };

      baselineAfterLoad();

      setTimeout(
        baselineAfterLoad,
        0
      );

      setTimeout(
        baselineAfterLoad,
        300
      );

      window.addEventListener(
        "load",
        baselineAfterLoad
      );

      window.addEventListener(
        "pageshow",
        baselineAfterLoad
      );

      // =========================
      // USER INTERACTION
      // =========================

      accountForm.addEventListener(
        "pointerdown",
        armUser,
        { passive: true }
      );

      accountForm.addEventListener(
        "keydown",
        armUser
      );

      accountForm.addEventListener(
        "paste",
        armUser
      );

      // =========================
      // CONTACT NUMBER
      // Digits only + max 11
      // =========================

      if (contactNumber) {
        contactNumber.addEventListener(
          "input",
          () => {
            contactNumber.value =
              contactNumber.value
                .replace(/\D/g, "")
                .slice(0, 11);

            userArmed = true;

            updateConfirmState();
          }
        );
      }

      // =========================
      // OTHER ACCOUNT INPUTS
      // =========================

      [facebookLink, emailAddress]
        .filter(Boolean)
        .forEach((input) => {
          input.addEventListener(
            "input",
            () => {
              userArmed = true;
              updateConfirmState();
            }
          );

          input.addEventListener(
            "change",
            () => {
              userArmed = true;
              updateConfirmState();
            }
          );
        });

      // =========================
      // SUBMIT ACCOUNT CHANGES
      // =========================

      accountForm.addEventListener(
        "submit",
        (event) => {
          event.preventDefault();

          if (confirmBtn?.disabled) {
            return;
          }

          if (!accountForm.reportValidity()) {
            return;
          }

          // Contact number validation
          if (contactNumber) {
            const digits =
              normalize(contactNumber);

            if (
              digits.length > 0 &&
              digits.length !== 11
            ) {
              contactNumber.setCustomValidity(
                "Contact number must be exactly 11 digits."
              );

              contactNumber.reportValidity();

              return;
            }

            contactNumber.setCustomValidity("");
          }

          // =========================
          // SAVE ACCOUNT TO DATABASE
          // =========================

          fetch(
            "settings.php?action=update_account",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                contactNumber:
                  contactNumber?.value || "",

                facebookLink:
                  facebookLink?.value || "",

                emailAddress:
                  emailAddress?.value || ""
              })
            }
          )
            .then(async (response) => {
              const data =
                await response.json()
                  .catch(() => ({}));

              if (
                !response.ok ||
                !data.success
              ) {
                throw new Error(
                  data.message ||
                  "Unable to save account information."
                );
              }

              return data;
            })

            .then((data) => {
              // Save the new values as baseline
              captureBaseline();

              userArmed = false;

              if (accountMessage) {
                accountMessage.textContent =
                  data.message;
              }
            })

            .catch((error) => {
              if (accountMessage) {
                accountMessage.textContent =
                  error.message;
              }

              userArmed = true;

              updateConfirmState();
            });
        }
      );
    }

    // =========================
    // LOAD ACCOUNT DATA
    // FROM DATABASE
    // =========================

    fetch(
      "settings.php?action=get_account"
    )
      .then(async (response) => {
        const data =
          await response.json()
            .catch(() => ({}));

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
            "Unable to load account information."
          );
        }

        return data;
      })

      .then((data) => {
        const account =
          data.account || {};

        const contactNumber =
          document.getElementById(
            "contactNumber"
          );

        const facebookLink =
          document.getElementById(
            "facebookLink"
          );

        const emailAddress =
          document.getElementById(
            "emailAddress"
          );

        if (contactNumber) {
          contactNumber.value =
            account.contact_no || "";
        }

        if (facebookLink) {
          facebookLink.value =
            account.facebook_link || "";
        }

        if (emailAddress) {
          emailAddress.value =
            account.email || "";
        }

        /*
         * Re-capture baseline after the
         * database values have loaded.
         */
        if (accountForm) {
          const fields = [
            contactNumber,
            facebookLink,
            emailAddress
          ].filter(Boolean);

          fields.forEach((el) => {
            // no-op; values are already populated
          });
        }
      })

      .catch((error) => {
        const accountMessage =
          document.getElementById(
            "accountMessage"
          );

        if (accountMessage) {
          accountMessage.textContent =
            error.message;
        }
      });

    // =========================
    // INITIAL PANEL
    // =========================

    showTab("account");
  }

  // =========================
  // INITIALIZE
  // =========================

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initializeSettings,
      { once: true }
    );
  } else {
    initializeSettings();
  }
})();
```
