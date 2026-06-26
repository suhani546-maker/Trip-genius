const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/frontend/login.html";
}

// Get tripId from URL
const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get("tripId");

function applyTheme(theme) {
    const body = document.getElementById("itineraryBody");
    body.classList.remove("theme-mountain", "theme-desert", "theme-beach", "theme-urban");
    if (theme !== "default") {
        body.classList.add("theme-" + theme);
    }
}

async function loadTrip() {
    try {
        const response = await fetch("http://localhost:8000/api/trips", {
            method: "GET",
            headers: { "Authorization": "Bearer " + token }
        });
        const trips = await response.json();
        const trip = trips.find(t => t._id === tripId);

        if (!trip) {
            alert("Trip not found!");
            window.location.href = "/frontend/home.html";
            return;
        }

        document.getElementById("loadingDestText").textContent =
            "Packing your bags for " + trip.destination;

        // Start the AI call immediately (it takes a few seconds anyway)
        const aiPromise = fetch("http://localhost:8000/api/itinerary/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                destination: trip.destination,
                budget: trip.budget,
                duration: trip.duration,
                interests: trip.interests,
                travelPace: trip.travelPace
            })
        }).then(r => r.json());

        // Ensure loading screen shows for at least 4.5s, then show results
        setTimeout(async function() {
            try {
                const aiData = await aiPromise;
                applyTheme(aiData.theme);
                showResults(trip, aiData.itinerary);
            } catch (err) {
                showResults(trip, null);
            }
        }, 4500);

    } catch (err) {
        alert("Something went wrong loading your trip!");
    }
}

function showResults(trip, rawItinerary) {
    document.getElementById("loadingScreen").style.display = "none";
    document.getElementById("resultScreen").style.display = "block";

    document.getElementById("tripTitle").textContent = trip.destination;
    document.getElementById("tripMeta").innerHTML = `
        <span><i class="fa-solid fa-wallet"></i> ₹${trip.budget}</span>
        <span><i class="fa-solid fa-calendar-days"></i> ${trip.duration} days</span>
        <span><i class="fa-solid fa-heart"></i> ${trip.interests.join(", ")}</span>
        <span><i class="fa-solid fa-gauge"></i> ${trip.travelPace} pace</span>
    `;

    if (!rawItinerary) {
        document.getElementById("itineraryContent").innerHTML =
            "<p>Couldn't generate itinerary right now. Please try again!</p>";
        return;
    }

    const dayBlocks = rawItinerary.split(/(?=Day \d+:)/g);

    let html = "";
    dayBlocks.forEach(function(block) {
        if (block.trim() === "") return;
        const lines = block.split("\n");
        const dayTitle = lines[0].replace(":", "").trim();
        const dayContent = lines.slice(1).join("\n").trim();

        html += `
            <div class="day-block">
                <h3>${dayTitle}</h3>
                <p>${dayContent}</p>
            </div>
        `;
    });

    document.getElementById("itineraryContent").innerHTML = html;
}

loadTrip();