// =========================
// LIVE DATE AND TIME
// =========================

function updateDateTime() {

    const now = new Date();


    // DATE
    const dateOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
    };

    const formattedDate =
        now.toLocaleDateString("en-US", dateOptions);


    // TIME
    const timeOptions = {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    };

    const formattedTime =
        now.toLocaleTimeString("en-US", timeOptions);


    // DISPLAY
    document.getElementById("currentDate").textContent =
        formattedDate;

    document.getElementById("currentTime").textContent =
        formattedTime;
}


// Run immediately
updateDateTime();


// Update every second
setInterval(updateDateTime, 1000);