// =========================
// ELEMENTS
// =========================
const supplierTableBody = document.getElementById("supplierTableBody");
const supplierEmptyState = document.getElementById("supplierEmptyState");

const supplierRegisteredCount = document.getElementById("supplierRegisteredCount");
const totalSupplierCount = document.getElementById("totalSupplierCount");
const visibleSupplierCount = document.getElementById("visibleSupplierCount");

const supplierSearch = document.getElementById("supplierSearch");
const statusFilter = document.getElementById("statusFilter");
const addSupplierBtn = document.getElementById("addSupplierBtn");

// =========================
// TEMP DATA (replace with DB later)
// =========================
let suppliers = [
  {
    supplierId: "SUP-001",
    name: "Steel Corporation",
    contactPerson: "Juan Reyes",
    contactNumber: "02-8123-4567",
    email: "juan@manilasteel.com",
    address: "Valenzuela, Metro Manila",
    status: "active",
  },
  {
    supplierId: "SUP-002",
    name: "Port Steel Corp.",
    contactPerson: "Maria Santos",
    contactNumber: "02-8234-5678",
    email: "maria@portsteel.com",
    address: "Caloocan City, Metro Manila",
    status: "active",
  },
  {
    supplierId: "SUP-003",
    name: "Visayas Hardware Supply",
    contactPerson: "Pedro Cruz",
    contactNumber: "032-234-5678",
    email: "pedro@vh-supply.com",
    address: "Mandaue City",
    status: "active",
  },
  {
    supplierId: "SUP-004",
    name: "SUD-MOT Waterworks",
    contactPerson: "Ana Dela Cruz",
    contactNumber: "082-345-6789",
    email: "ana@wmworks.com",
    address: "Davao City",
    status: "inactive",
  },
  {
    supplierId: "SUP-005",
    name: "GlobalSteel PH Inc.",
    contactPerson: "Roberto Lim",
    contactNumber: "02-8456-7890",
    email: "rlim@globalsteel.ph",
    address: "Pasig, Metro Manila",
    status: "active",
  },
];

// =========================
// HELPERS
// =========================
function createStatusBadge(status) {
  if (status === "active") {
    return `<span class="status-badge status-active">ACTIVE</span>`;
  }
  return `<span class="status-badge status-inactive">INACTIVE</span>`;
}

function createActions(supplierId) {
  return `
    <div class="supplier-actions">

      <button class="action-btn view" type="button" title="View" data-id="${supplierId}">
        <svg viewBox="0 0 24 24">
          <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>

      <button class="action-btn edit" type="button" title="Edit" data-id="${supplierId}">
        <svg viewBox="0 0 24 24">
          <path d="M4 20h4L19 9l-4-4L4 16v4z"></path>
          <path d="M13 7l4 4"></path>
        </svg>
      </button>

      <button class="action-btn delete" type="button" title="Delete" data-id="${supplierId}">
        <svg viewBox="0 0 24 24">
          <path d="M4 7h16"></path>
          <path d="M9 7V4h6v3"></path>
          <path d="M7 7l1 13h8l1-13"></path>
          <path d="M10 11v5"></path>
          <path d="M14 11v5"></path>
        </svg>
      </button>

    </div>
  `;
}

function displaySummary() {
  supplierRegisteredCount.textContent = String(suppliers.length);
}

function displaySuppliers(list) {
  supplierTableBody.innerHTML = "";

  totalSupplierCount.textContent = String(suppliers.length);
  visibleSupplierCount.textContent = String(list.length);

  if (list.length === 0) {
    supplierEmptyState.style.display = "flex";
    return;
  }

  supplierEmptyState.style.display = "none";

  list.forEach((s) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.supplierId}</td>
      <td>${s.name}</td>
      <td>${s.contactPerson}</td>
      <td>${s.contactNumber}</td>
      <td>${s.email}</td>
      <td>${s.address}</td>
      <td>${createStatusBadge(s.status)}</td>
      <td>${createActions(s.supplierId)}</td>
    `;
    supplierTableBody.appendChild(tr);
  });
}

function filterSuppliers() {
  const search = supplierSearch.value.toLowerCase().trim();
  const status = statusFilter.value;

  const filtered = suppliers.filter((s) => {
    const haystack = [
      s.supplierId,
      s.name,
      s.contactPerson,
      s.contactNumber,
      s.email,
      s.address,
    ].join(" ").toLowerCase();

    const matchesSearch = search === "" || haystack.includes(search);
    const matchesStatus = status === "" || s.status === status;

    return matchesSearch && matchesStatus;
  });

  displaySuppliers(filtered);
}

// =========================
// EVENTS
// =========================
supplierSearch.addEventListener("input", filterSuppliers);
statusFilter.addEventListener("change", filterSuppliers);

addSupplierBtn.addEventListener("click", () => {
  console.log("Add Supplier clicked (connect to modal/form later).");
});

// action buttons (delegation)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".action-btn");
  if (!btn) return;

  const id = btn.dataset.id;

  if (btn.classList.contains("view")) console.log("VIEW", id);
  if (btn.classList.contains("edit")) console.log("EDIT", id);
  if (btn.classList.contains("delete")) console.log("DELETE", id);
});

// =========================
// INIT
// =========================
displaySummary();
displaySuppliers(suppliers);