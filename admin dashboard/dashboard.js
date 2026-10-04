// =========================
// LIVE DATE AND TIME
// Safe if topbar elements are not loaded yet.
// =========================

function updateDateTime() {
    const dateEl = document.getElementById("currentDate");
    const timeEl = document.getElementById("currentTime");

    if (!dateEl && !timeEl) {
        return;
    }

    const now = new Date();

    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    }
}

updateDateTime();
setInterval(updateDateTime, 1000);


// =========================
// INVENTORY STATUS (DONUT + COUNTS)
// Uses inventory.php, same status rules as inventory.js
// =========================

(function () {
    const COLORS = {
        underMonitor: "#3b73d1",
        inStock: "#25b88a",
        lowStock: "#f0a323",
        outStock: "#e75d5d"
    };

    function getStatus(item) {
        const stock = Number(item.stock) || 0;
        const minimum = Number(item.minimumStock) || 0;

        if (stock <= 0) return "outStock";
        if (stock < minimum) return "lowStock";
        if (stock <= Math.ceil(minimum * 1.5)) return "underMonitor";
        return "inStock";
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function buildDonut(counts, total) {
        if (total === 0) {
            return "conic-gradient(#dedede 0deg 360deg)";
        }

        const parts = [];
        let start = 0;

        ["underMonitor", "inStock", "lowStock", "outStock"].forEach(key => {
            if (counts[key] === 0) return;

            const end = start + (counts[key] / total) * 360;
            parts.push(`${COLORS[key]} ${start}deg ${end}deg`);
            start = end;
        });

        return `conic-gradient(${parts.join(", ")})`;
    }

    async function loadInventoryStatus() {
        try {
            const response = await fetch("inventory.php");
            const data = await response.json();

            if (!data.ok) {
                throw new Error(data.error || "Unknown server error");
            }

            const items = data.items || [];
            const counts = { underMonitor: 0, inStock: 0, lowStock: 0, outStock: 0 };

            items.forEach(item => {
                counts[getStatus(item)] += 1;
            });

            setText("underMonitorCount", counts.underMonitor);
            setText("inStockCount", counts.inStock);
            setText("lowStockCount", counts.lowStock);
            setText("outStockCount", counts.outStock);

            setText("totalProducts", items.length);
            setText("lowStockItems", counts.lowStock);

            const donut = document.getElementById("inventoryDonut");
            if (donut) {
                donut.style.background = buildDonut(counts, items.length);
            }
        } catch (err) {
            console.error("Dashboard inventory status failed:", err);
        }
    }

    loadInventoryStatus();
})();