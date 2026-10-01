// messages.js (UI-only for now: no database, no localStorage)

// =========================
// ELEMENTS
// =========================
const messagesBody = document.getElementById("messagesBody");
const tbody = document.getElementById("messagesTbody");
const countHint = document.getElementById("countHint");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

const refreshBtn = document.getElementById("refreshBtn");
const exportBtn = document.getElementById("exportBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

// Modal
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

// =========================
// STATE (Dummy data for UI preview)
// Later: replace `messages = [...]` with API/DB fetch
// =========================
let messages = [
  // Uncomment to test UI with sample rows:
  // {
  //   id: 1,
  //   created_at: new Date().toISOString(),
  //   name: "Juan Dela Cruz",
  //   email: "juan@email.com",
  //   phone: "0917 123 4567",
  //   message: "Hello, may available po ba na stocks? Pa-quote po. Thank you.",
  //   status: "unread"
  // },
  // {
  //   id: 2,
  //   created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
  //   name: "Maria Santos",
  //   email: "maria@email.com",
  //   phone: "0999 888 7777",
  //   message: "Good day! Pwede po malaman delivery options and lead time?",
  //   status: "read"
  // }
];

let currentId = null;

// =========================
// HELPERS
// =========================
function esc(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
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
  return s === "read" ? "read" : "unread";
}

// =========================
// FILTER + RENDER
// =========================
function getFiltered() {
  const q = (searchInput.value || "").trim().toLowerCase();
  const st = statusFilter.value; // all | unread | read

  return messages.filter((m) => {
    const status = normalizeStatus(m.status);
    const matchStatus = st === "all" || status === st;

    const hay = [
      m.name,
      m.email,
      m.phone,
      m.message
    ].join(" ").toLowerCase();

    const matchQuery = !q || hay.includes(q);

    return matchStatus && matchQuery;
  });
}

function render() {
  const filtered = getFiltered();

  countHint.textContent = `${filtered.length} message${filtered.length === 1 ? "" : "s"}`;

  if (filtered.length === 0) {
    tbody.innerHTML = "";
    setEmpty(true);
    return;
  }

  setEmpty(false);

  tbody.innerHTML = filtered.map((m) => {
    const status = normalizeStatus(m.status);

    const badge = status === "unread"
      ? `<span class="badge badge-unread">Unread</span>`
      : `<span class="badge badge-read">Read</span>`;

    return `
      <tr data-id="${esc(m.id)}">
        <td>${esc(formatDate(m.created_at))}</td>
        <td>${esc(m.name || "—")}</td>
        <td>${esc(m.email || "—")}</td>
        <td>${esc(m.phone || "—")}</td>
        <td>${badge}</td>
        <td>
          <div class="row-actions">
            <button class="m-btn js-view" type="button">View</button>
            <button class="m-btn js-toggle" type="button">
              ${status === "unread" ? "Mark Read" : "Mark Unread"}
            </button>
            <button class="m-btn m-btn-danger js-delete" type="button">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// =========================
// MODAL
// =========================
function openModal(id) {
  const m = messages.find(x => String(x.id) === String(id));
  if (!m) return;

  currentId = String(id);

  const status = normalizeStatus(m.status);

  modalMeta.textContent = `Received: ${formatDate(m.created_at)}`;
  modalFrom.textContent = m.name || "—";
  modalEmail.textContent = m.email || "—";
  modalPhone.textContent = m.phone || "—";
  modalStatus.textContent = status === "unread" ? "Unread" : "Read";
  modalMessage.textContent = m.message || "—";

  toggleReadBtn.textContent = status === "unread" ? "Mark as Read" : "Mark as Unread";

  modalBackdrop.classList.add("show");
  modalBackdrop.setAttribute("aria-hidden", "false");
}

function closeModal() {
  currentId = null;
  modalBackdrop.classList.remove("show");
  modalBackdrop.setAttribute("aria-hidden", "true");
}

// =========================
// ACTIONS
// =========================
function toggleRead(id) {
  const idx = messages.findIndex(x => String(x.id) === String(id));
  if (idx === -1) return;

  const current = normalizeStatus(messages[idx].status);
  messages[idx].status = current === "unread" ? "read" : "unread";

  render();
  if (currentId === String(id)) openModal(id);
}

function deleteOne(id) {
  messages = messages.filter(x => String(x.id) !== String(id));
  render();
  if (currentId === String(id)) closeModal();
}

function clearAll() {
  messages = [];
  render();
  closeModal();
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(messages, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `messages_ui_preview_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

// =========================
// EVENTS
// =========================
tbody.addEventListener("click", (e) => {
  const tr = e.target.closest("tr[data-id]");
  if (!tr) return;
  const id = tr.getAttribute("data-id");

  if (e.target.classList.contains("js-view")) openModal(id);

  if (e.target.classList.contains("js-toggle")) toggleRead(id);

  if (e.target.classList.contains("js-delete")) {
    if (confirm("Delete this message?")) deleteOne(id);
  }
});

searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);

refreshBtn.addEventListener("click", render);

exportBtn.addEventListener("click", exportJSON);

clearAllBtn.addEventListener("click", () => {
  if (!confirm("Clear all messages?")) return;
  clearAll();
});

// modal
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

// =========================
// INIT
// =========================
render();