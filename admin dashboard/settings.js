// =========================
// SETTINGS
// =========================

(() => {
  "use strict";


  // =========================
  // INITIALIZE
  // =========================

  function initializeSettings() {

    const content =
      document.querySelector(".settings-content");

    if (
      !content ||
      content.dataset.settingsInitialized === "true"
    ) {
      return;
    }

    content.dataset.settingsInitialized = "true";


    // =========================
    // HELPERS
    // =========================

    function setDisabled(button, disabled) {

      if (!button) {
        return;
      }

      button.disabled = disabled;

      if (disabled) {
        button.setAttribute("disabled", "");
      } else {
        button.removeAttribute("disabled");
      }
    }


    function showMessage(
      element,
      message,
      type = ""
    ) {

      if (!element) {
        return;
      }

      element.textContent = message;

      element.classList.remove(
        "success-message",
        "error-message",
        "password-error"
      );

      if (type) {
        element.classList.add(type);
      }
    }


    async function request(
      url,
      options = {}
    ) {

      const response =
        await fetch(url, options);

      const data =
        await response.json().catch(() => ({}));

      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.message ||
          "An unexpected error occurred."
        );
      }

      return data;
    }


    // =========================
    // PASSWORD VISIBILITY
    // =========================

    const eyeIcon = `
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        ></path>

        <circle
          cx="12"
          cy="12"
          r="3"
        ></circle>
      </svg>
    `;


    const eyeOffIcon = `
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="m3 3 18 18"></path>

        <path
          d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
        ></path>

        <path
          d="M9.9 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.1 4.1"
        ></path>

        <path
          d="M6.2 6.2A19 19 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 5.8-1.8"
        ></path>
      </svg>
    `;


    const passwordButtons =
      content.querySelectorAll(
        ".password-toggle"
      );


    function setPasswordVisibility(
      button,
      visible
    ) {

      const input =
        document.getElementById(
          button.dataset.passwordTarget
        );

      if (!input) {
        return;
      }

      const label =
        input.labels?.[0]?.textContent.trim() ||
        "password";

      input.type =
        visible
          ? "text"
          : "password";

      button.innerHTML =
        visible
          ? eyeOffIcon
          : eyeIcon;

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

      passwordButtons.forEach(
        (button) => {

          setPasswordVisibility(
            button,
            false
          );

        }
      );
    }


    passwordButtons.forEach(
      (button) => {

        setPasswordVisibility(
          button,
          false
        );

        button.addEventListener(
          "click",
          () => {

            const visible =
              button.getAttribute(
                "aria-pressed"
              ) === "true";

            setPasswordVisibility(
              button,
              !visible
            );

          }
        );

      }
    );


    // =========================
    // SETTINGS TABS
    // =========================

    const tabButtons =
      content.querySelectorAll(
        ".settings-tab-btn"
      );


    const panels = {

      account:
        document.getElementById(
          "tab-account"
        ),

      notification:
        document.getElementById(
          "tab-notification"
        )

    };


    function showTab(tabName) {

      if (!panels[tabName]) {
        return;
      }

      tabButtons.forEach(
        (button) => {

          const active =
            button.dataset.settingsTab ===
            tabName;

          button.classList.toggle(
            "active",
            active
          );

          button.setAttribute(
            "aria-pressed",
            String(active)
          );

        }
      );


      Object.entries(panels).forEach(
        ([name, panel]) => {

          if (panel) {
            panel.hidden =
              name !== tabName;
          }

        }
      );


      if (tabName !== "account") {
        hideAllPasswords();
      }

    }


    tabButtons.forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            showTab(
              button.dataset.settingsTab
            );

          }
        );

      }
    );


    // =========================
    // ACCOUNT FORM
    // =========================

    const accountForm =
      document.getElementById(
        "accountForm"
      );


    if (accountForm) {

      const adminUsername =
        document.getElementById(
          "adminUsername"
        );


      const accountAdminUsername =
        document.getElementById(
          "accountAdminUsername"
        );


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


      const confirmBtn =
        document.getElementById(
          "accountConfirmBtn"
        );


      const accountMessage =
        document.getElementById(
          "accountMessage"
        );


      const inputs = [

        adminUsername,

        contactNumber,

        facebookLink,

        emailAddress

      ].filter(Boolean);


      const initialValues =
        new Map();


      let userArmed = false;


      // =========================
      // NORMALIZE
      // =========================

      function normalize(input) {

        if (!input) {
          return "";
        }


        if (
          input.id ===
          "contactNumber"
        ) {

          return input.value
            .replace(/\D/g, "");

        }


        return input.value.trim();

      }


      // =========================
      // BASELINE
      // =========================

      function captureBaseline() {

        initialValues.clear();


        inputs.forEach(
          (input) => {

            initialValues.set(
              input.id,
              normalize(input)
            );

          }
        );


        setDisabled(
          confirmBtn,
          true
        );

      }


      function hasChanges() {

        return inputs.some(
          (input) => {

            return (
              normalize(input) !==
              initialValues.get(
                input.id
              )
            );

          }
        );

      }


      // =========================
      // CONFIRM BUTTON
      // =========================

      function updateConfirmState() {

        if (!userArmed) {

          setDisabled(
            confirmBtn,
            true
          );

          return;

        }


        setDisabled(
          confirmBtn,
          !hasChanges()
        );


        if (accountMessage) {

          showMessage(
            accountMessage,
            ""
          );

        }

      }


      function armUser() {

        userArmed = true;

        updateConfirmState();

      }


      // =========================
      // LOAD ACCOUNT
      // =========================

      async function loadAccount() {

        try {

          const data =
            await request(
              "settings.php?action=get_account"
            );


          const account =
            data.account || {};


          if (adminUsername) {

            adminUsername.value =
              account.username || "";

          }


          if (accountAdminUsername) {

            accountAdminUsername.textContent =
              account.username || "";

          }


          if (contactNumber) {

            contactNumber.value =
              account.contact_no || "";

          }


          if (facebookLink) {

            facebookLink.value =
              account.links || "";

          }


          if (emailAddress) {

            emailAddress.value =
              account.email || "";

          }


          captureBaseline();

          userArmed = false;

        }

        catch (error) {

          showMessage(
            accountMessage,
            error.message ||
            "Unable to load account information.",
            "error-message"
          );

        }

      }


      loadAccount();


      // =========================
      // ACCOUNT INPUT EVENTS
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
      // ADMIN USERNAME
      // =========================

      if (adminUsername) {

        adminUsername.addEventListener(
          "input",
          () => {

            userArmed = true;

            updateConfirmState();

          }
        );

      }


      // =========================
      // CONTACT NUMBER
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
      // FACEBOOK + EMAIL
      // =========================

      [
        facebookLink,
        emailAddress

      ]
        .filter(Boolean)
        .forEach(
          (input) => {

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

          }
        );


      // =========================
      // SAVE ACCOUNT
      // =========================

      accountForm.addEventListener(
        "submit",
        async (event) => {

          event.preventDefault();


          if (
            !confirmBtn ||
            confirmBtn.disabled
          ) {

            return;

          }


          showMessage(
            accountMessage,
            ""
          );


          setDisabled(
            confirmBtn,
            true
          );


          showMessage(
            accountMessage,
            "Saving..."
          );


          try {

            const data =
              await request(
                "settings.php?action=update_account",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json"
                  },

                  body: JSON.stringify({

                    adminUsername:
                      adminUsername?.value.trim() ||
                      "",

                    contactNumber:
                      contactNumber?.value ||
                      "",

                    facebookLink:
                      facebookLink?.value.trim() ||
                      "",

                    emailAddress:
                      emailAddress?.value.trim() ||
                      ""

                  })

                }
              );


            if (accountAdminUsername) {

            accountAdminUsername.textContent =
                adminUsername?.value.trim() || "";

        }


        // =========================
        // UPDATE SIDEBAR USERNAME
        // =========================

        const sidebarAdminUsername =
            document.getElementById(
                "sidebarAdminUsername"
            );

        if (sidebarAdminUsername) {

            sidebarAdminUsername.textContent =
                adminUsername?.value.trim() ||
                "Administrator";

        }


            captureBaseline();

            userArmed = false;


            showMessage(
              accountMessage,
              data.message ||
              "Changes saved successfully.",
              "success-message"
            );

          }

          catch (error) {

            userArmed = true;


            showMessage(
              accountMessage,
              error.message ||
              "Unable to save changes.",
              "error-message"
            );


            updateConfirmState();

          }

        }
      );

    }


    // =========================
    // CHANGE PASSWORD
    // =========================

    const passwordForm =
      document.getElementById(
        "changePasswordForm"
      );


    const currentPassword =
      document.getElementById(
        "currentPassword"
      );


    const newPassword =
      document.getElementById(
        "newPassword"
      );


    const confirmPassword =
      document.getElementById(
        "confirmPassword"
      );


    const passwordMessage =
      document.getElementById(
        "passwordMessage"
      );


    const changePasswordBtn =
      document.getElementById(
        "changePasswordBtn"
      );


    if (
      passwordForm &&
      currentPassword &&
      newPassword &&
      confirmPassword &&
      passwordMessage &&
      changePasswordBtn
    ) {


      function clearPasswordFeedback() {

        passwordMessage.textContent = "";

        passwordMessage.classList.remove(
          "password-error",
          "error-message",
          "success-message"
        );

      }


      function updatePasswordButton() {

        const allFilled =
          currentPassword.value.trim() !== "" &&
          newPassword.value.trim() !== "" &&
          confirmPassword.value.trim() !== "";


        setDisabled(
          changePasswordBtn,
          !allFilled
        );

      }


      [
        currentPassword,
        newPassword,
        confirmPassword

      ].forEach(
        (input) => {

          input.addEventListener(
            "input",
            () => {

              clearPasswordFeedback();

              updatePasswordButton();

            }
          );

        }
      );


      updatePasswordButton();


      passwordForm.addEventListener(
        "submit",
        async (event) => {

          event.preventDefault();


          clearPasswordFeedback();


          if (
            changePasswordBtn.disabled
          ) {

            return;

          }


          hideAllPasswords();


          setDisabled(
            changePasswordBtn,
            true
          );


          showMessage(
            passwordMessage,
            "Changing password..."
          );


          try {

            const data =
              await request(
                "settings.php?action=change_password",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json"
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
              );


            passwordForm.reset();

            hideAllPasswords();

            updatePasswordButton();


            showMessage(
              passwordMessage,
              data.message ||
              "Password changed successfully.",
              "success-message"
            );

          }

          catch (error) {

            updatePasswordButton();


            showMessage(
              passwordMessage,
              error.message ||
              "Unable to change password.",
              "error-message"
            );

          }

        }
      );


      passwordForm.addEventListener(
        "reset",
        () => {

          clearPasswordFeedback();

          hideAllPasswords();

          setTimeout(
            updatePasswordButton,
            0
          );

        }
      );

    }


    // =========================
    // NOTIFICATIONS
    // (saved in the database via settings.php;
    //  localStorage is only a fast cache for topbar.js)
    // =========================

    const NOTIF_PREFS_KEY = "scfNotificationPrefs";

    // checkbox id -> preference key (same keys as settings.php)
    const NOTIF_FIELDS = {
      notifInquiries:   "inquiries",
      notifLowStock:    "lowStock",
      notifFabrication: "fabrication",
      notifPoDelivery:  "poDelivery",
      notifDailySales:  "dailySales",
      notifPaymentDue:  "paymentDue"
    };

    const NOTIF_DEFAULTS = {
      inquiries:   true,
      lowStock:    false,
      fabrication: false,
      poDelivery:  false,
      dailySales:  false,
      paymentDue:  false
    };

    function readCachedPrefs() {
      try {
        const saved = JSON.parse(
          localStorage.getItem(NOTIF_PREFS_KEY) || "{}"
        );
        return Object.assign({}, NOTIF_DEFAULTS, saved);
      } catch (error) {
        return Object.assign({}, NOTIF_DEFAULTS);
      }
    }

    function cachePrefs(prefs) {
      try {
        localStorage.setItem(
          NOTIF_PREFS_KEY,
          JSON.stringify(prefs)
        );
      } catch (error) {
        // ignore
      }

      // Tell the topbar (same page) to refresh right away.
      window.dispatchEvent(
        new CustomEvent("scf:notification-prefs-changed")
      );
    }

    function applyPrefsToSwitches(prefs) {
      Object.keys(NOTIF_FIELDS).forEach((id) => {
        const input = document.getElementById(id);

        if (input) {
          input.checked = !!prefs[NOTIF_FIELDS[id]];
        }
      });
    }

    function collectPrefsFromSwitches() {
      const prefs = {};

      Object.keys(NOTIF_FIELDS).forEach((id) => {
        const input = document.getElementById(id);

        prefs[NOTIF_FIELDS[id]] =
          input ? input.checked : false;
      });

      return prefs;
    }


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

      let switchesTouched = false;

      // 1) Show the cached values right away
      applyPrefsToSwitches(readCachedPrefs());

      // 2) Then load the real values from the database
      request(
        "settings.php?action=get_notification_settings",
        {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          headers: { "Accept": "application/json" }
        }
      )
        .then((data) => {

          if (!switchesTouched && data.settings) {
            applyPrefsToSwitches(data.settings);
          }

          if (data.settings) {
            cachePrefs(data.settings);
          }

        })
        .catch((error) => {
          console.error(
            "Notification settings load error:",
            error
          );
        });


      // Clear the message when a switch changes
      notificationPanel
        .querySelectorAll('input[type="checkbox"]')
        .forEach((input) => {

          input.addEventListener(
            "change",
            () => {
              switchesTouched = true;
              notificationMessage.textContent = "";
            }
          );

        });


      // Save to the database
      saveNotificationButton.addEventListener(
        "click",
        async () => {

          const prefs = collectPrefsFromSwitches();

          setDisabled(saveNotificationButton, true);

          try {

            const data = await request(
              "settings.php?action=save_notification_settings",
              {
                method: "POST",
                credentials: "same-origin",
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json"
                },
                body: JSON.stringify(prefs)
              }
            );

            cachePrefs(prefs);

            showMessage(
              notificationMessage,
              data.message ||
              "Notification settings saved.",
              "success-message"
            );

          } catch (error) {

            showMessage(
              notificationMessage,
              error.message ||
              "Unable to save notification settings.",
              "error-message"
            );

          } finally {

            setDisabled(saveNotificationButton, false);

          }

        }
      );

    }


    // =========================
    // INITIAL TAB
    // =========================

    showTab("account");

  }


  // =========================
  // START
  // =========================

  if (
    document.readyState ===
    "loading"
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