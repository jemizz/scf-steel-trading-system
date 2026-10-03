// messages.js — loads customer inquiries from the inquiries table

const messagesBody = document.getElementById("messagesBody");
const tbody = document.getElementById("messagesTbody");
const countHint = document.getElementById("countHint");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

const refreshBtn = document.getElementById("refreshBtn");
const exportBtn = document.getElementById("exportBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

const modalBackdrop = document.getElementById("modalBackdrop");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalMeta = document.getElementById("modalMeta");
const modalFrom = document.getElementById("modalFrom");
const modalEmail = document.getElementById("modalEmail");
const modalPhone = document.getElementById("modalPhone");
const modalStatus = document.getElementById("modalStatus");
const modalMessage = document.getElementById("modalMessage");

const toggleReadBtn = document.getElementById("toggleReadBtn");
const deleteBtn = document.getElementById("deleteBtn");

const MESSAGES_API = "messages.php";

let messages = [];
let currentId = null;

function esc(str) {
  const node = document.createElement("span");
  node.textContent = str == null ? "" : String(str);
  return node.innerHTML;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(String(iso).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function setEmpty(isEmpty) {
  messagesBody.classList.toggle("is-empty", isEmpty);
}

function normalizeStatus(s) {
  return String(s || "").trim().toLowerCase() === "read" ? "read" : "unread";
}

async function apiRequest(action, payload = {}) {
  const body = new URLSearchParams();
  body.set("action", action);

  Object.entries(payload).forEach(([key, value]) => {
    body.set(key, value ?? "");
  });

  const response = await fetch(MESSAGES_API, {
    method: "POST",
    headers: {
      "Accept": "application/json"
    },
    body
  });

  const raw = await response.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (error) {
    const preview = raw.replace(/\s+/g, " ").trim().slice(0, 180);
    throw new Error(preview || "messages.php did not return JSON.");
  }

  if (!response.ok || !data.success) {
    throw new Error((data && data.message) || "Request failed.");
  }

  return data;
}

async function loadMessages() {
  countHint.textContent = "Loading messages...";

  try {
    const data = await apiRequest("list");
    messages = Array.isArray(data.messages) ? data.messages : [];
    render();
  } catch (error) {
    console.error("Load messages error:", error);
    messages = [];
    tbody.innerHTML = "";
    setEmpty(true);
    countHint.textContent = error.message || "Unable to load messages.";
  }
}

function getFiltered() {
  const q = (searchInput.value || "").trim().toLowerCase();
  const st = statusFilter.value;

  return messages.filter((m) => {
    const status = normalizeStatus(m.status);
    const matchStatus = st === "all" || status === st;

    const hay = [m.name, m.email, m.phone, m.message].join(" ").toLowerCase();
    const matchQuery = !q || hay.includes(q);

    return matchStatus && matchQuery;
  });
}

function render() {

  const filtered = getFiltered();

  countHint.textContent =
    `${filtered.length} message${filtered.length === 1 ? "" : "s"}`;


  if (filtered.length === 0) {

    tbody.innerHTML = "";

    setEmpty(true);

    return;
  }


  setEmpty(false);


  tbody.innerHTML = filtered.map((m) => {

    const status = normalizeStatus(m.status);


    const badge =
      status === "unread"
        ? `<span class="badge badge-unread">Unread</span>`
        : `<span class="badge badge-read">Read</span>`;


    /*
       If unread:
       clicking the envelope marks it as READ.

       If read:
       clicking the envelope marks it as UNREAD.
    */

    const toggleTitle =
      status === "unread"
        ? "Mark as Read"
        : "Mark as Unread";


    const toggleIcon =
      status === "unread"

        ? `
          <svg viewBox="0 0 24 24" aria-hidden="true">

            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2"
            ></rect>

            <path d="m4 7 8 6 8-6"></path>

          </svg>
        `

        : `
          <svg viewBox="0 0 24 24" aria-hidden="true">

            <path d="M3 9.5 12 15l9-5.5"></path>

            <path
              d="
                M5 7h14
                a2 2 0 0 1 2 2
                v9
                a2 2 0 0 1-2 2
                H5
                a2 2 0 0 1-2-2
                V9
                a2 2 0 0 1 2-2Z
              "
            ></path>

          </svg>
        `;


    return `

      <tr data-id="${esc(m.id)}">

        <td>
          ${esc(formatDate(m.created_at))}
        </td>

        <td>
          ${esc(m.name || "—")}
        </td>

        <td>
          ${esc(m.email || "—")}
        </td>

        <td>
          ${esc(m.phone || "—")}
        </td>

        <td>
          ${badge}
        </td>


        <!-- ACTIONS -->
        <td>

          <div class="row-actions">


            <!-- VIEW -->
            <button
              class="action-icon action-view js-view"
              type="button"
              title="View Message"
              aria-label="View Message"
            >

              <svg viewBox="0 0 24 24" aria-hidden="true">

                <path
                  d="
                    M2.5 12
                    s3.5-6 9.5-6
                    9.5 6 9.5 6
                    -3.5 6-9.5 6
                    S2.5 12 2.5 12Z
                  "
                ></path>

                <circle
                  cx="12"
                  cy="12"
                  r="2.7"
                ></circle>

              </svg>

            </button>


            <!-- MARK READ / UNREAD -->
            <button
              class="action-icon action-toggle js-toggle"
              type="button"
              title="${toggleTitle}"
              aria-label="${toggleTitle}"
            >

              ${toggleIcon}

            </button>


            <!-- DELETE -->
            <button
              class="action-icon action-delete js-delete"
              type="button"
              title="Delete Message"
              aria-label="Delete Message"
            >

              <svg viewBox="0 0 24 24" aria-hidden="true">

                <path d="M4 7h16"></path>

                <path d="M9 7V4h6v3"></path>

                <path d="M6 7l1 13h10l1-13"></path>

                <path d="M10 11v5"></path>

                <path d="M14 11v5"></path>

              </svg>

            </button>


          </div>

        </td>

      </tr>

    `;

  }).join("");
}

function fillModal(id) {
  const m = messages.find((x) => String(x.id) === String(id));
  if (!m) return;

  const status = normalizeStatus(m.status);

  modalMeta.textContent = `Received: ${formatDate(m.created_at)}`;
  modalFrom.textContent = m.name || "—";
  modalEmail.textContent = m.email || "—";
  modalPhone.textContent = m.phone || "—";
  modalStatus.textContent = status === "unread" ? "Unread" : "Read";
  modalMessage.textContent = m.message || "—";
  toggleReadBtn.textContent = status === "unread" ? "Mark as Read" : "Mark as Unread";
}

function openModal(id) {
  const m = messages.find((x) => String(x.id) === String(id));
  if (!m) return;

  currentId = String(id);
  fillModal(id);

  modalBackdrop.classList.add("show");
  modalBackdrop.setAttribute("aria-hidden", "false");

  if (normalizeStatus(m.status) === "unread") {
    markAsRead(id).catch((error) => {
      alert(error.message || "Unable to mark as read.");
    });
  }
}

function closeModal() {
  currentId = null;
  modalBackdrop.classList.remove("show");
  modalBackdrop.setAttribute("aria-hidden", "true");
}

async function toggleRead(id) {
  const item = messages.find((x) => String(x.id) === String(id));
  if (!item) return;

  const nextStatus = normalizeStatus(item.status) === "unread" ? "read" : "unread";

  try {
    await apiRequest("set_status", {
      id,
      status: nextStatus
    });
    item.status = nextStatus;
    render();
    if (currentId === String(id)) fillModal(id);
  } catch (error) {
    alert(error.message || "Unable to update status.");
  }
}

async function markAsRead(id) {
  const item = messages.find((x) => String(x.id) === String(id));
  if (!item || normalizeStatus(item.status) === "read") return;

  await apiRequest("set_status", {
    id,
    status: "read"
  });

  item.status = "read";
  render();
  if (currentId === String(id)) fillModal(id);
}

async function deleteOne(id) {
  try {
    await apiRequest("delete", { id });
    messages = messages.filter((x) => String(x.id) !== String(id));
    render();
    if (currentId === String(id)) closeModal();
  } catch (error) {
    alert(error.message || "Unable to delete inquiry.");
  }
}

async function clearAll() {
  try {
    await apiRequest("clear_all");
    messages = [];
    render();
    closeModal();
  } catch (error) {
    alert(error.message || "Unable to clear inquiries.");
  }
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(messages, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `inquiries_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

tbody.addEventListener("click", (e) => {

  const button = e.target.closest(
    ".js-view, .js-toggle, .js-delete"
  );


  if (!button) {
    return;
  }


  const tr = button.closest(
    "tr[data-id]"
  );


  if (!tr) {
    return;
  }


  const id =
    tr.getAttribute("data-id");


  // =========================
  // VIEW
  // =========================

  if (
    button.classList.contains("js-view")
  ) {

    openModal(id);

    return;
  }


  // =========================
  // MARK READ / UNREAD
  // =========================

  if (
    button.classList.contains("js-toggle")
  ) {

    toggleRead(id);

    return;
  }


  // =========================
  // DELETE
  // =========================

  if (
    button.classList.contains("js-delete")
  ) {

    if (
      confirm("Delete this message?")
    ) {

      deleteOne(id);
    }

  }

});

searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);

refreshBtn.addEventListener("click", loadMessages);
exportBtn.addEventListener("click", exportJSON);

clearAllBtn.addEventListener("click", () => {
  if (!confirm("Clear all messages?")) return;
  clearAll();
});

closeModalBtn.addEventListener("click", closeModal);

modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

toggleReadBtn.addEventListener("click", () => {
  if (!currentId) return;
  toggleRead(currentId);
});

deleteBtn.addEventListener("click", () => {
  if (!currentId) return;
  if (!confirm("Delete this message?")) return;
  deleteOne(currentId);
});

// Open a specific inquiry (called by the topbar notifications)
window.openInquiryById = async function (id) {
  if (!messages.some((x) => String(x.id) === String(id))) {
    await loadMessages(); // may bagong inquiry na wala pa sa list
  }

  const m = messages.find((x) => String(x.id) === String(id));
  if (!m) return;

  currentId = String(id);
  fillModal(id);
  modalBackdrop.classList.add("show");
  modalBackdrop.setAttribute("aria-hidden", "false");

  if (normalizeStatus(m.status) === "unread") {
    try {
      await markAsRead(id);
    } catch (error) {
      alert(error.message || "Unable to mark as read.");
    }
  }
};

loadMessages().then(() => {
  // Galing sa ibang page: messages.html?open=ID
  const openId = new URLSearchParams(window.location.search).get("open");
  if (openId) {
    window.openInquiryById(openId);
    history.replaceState(null, "", window.location.pathname);
  }
});