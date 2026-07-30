
      
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

// Get tripId from URL
const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get("tripId");

function applyTheme(theme) {
    window.currentTheme = theme;
    const body = document.getElementById("itineraryBody");
    body.classList.remove("theme-mountain", "theme-desert", "theme-beach", "theme-urban");
    if (theme !== "default") {
        body.classList.add("theme-" + theme);
    }
}

async function loadTrip() {
    try {
        const response = await fetch("https://trip-genius.onrender.com/api/trips", {
            method: "GET",
            headers: { "Authorization": "Bearer " + token }
        });
        const trips = await response.json();
        const trip = trips.find(t => t._id === tripId);

        if (!trip) {
            alert("Trip not found!");
            window.location.href = "home.html";
            return;
        }

        document.getElementById("loadingDestText").textContent =
            "Packing your bags for " + trip.destination;

        // Fetch weather forecast BEFORE generating itinerary, so AI can plan around it
        const weatherSummary = await getWeatherSummary(trip.destination, trip.duration);

        // Start the AI call immediately (it takes a few seconds anyway)
        const aiPromise = fetch("https://trip-genius.onrender.com/api/itinerary/generate", {
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
                travelPace: trip.travelPace,
                weatherForecast: weatherSummary
            })
        }).then(r => r.json());

        // Ensure loading screen shows for at least 4.5s, then show results
        setTimeout(async function() {
            try {
                const aiData = await aiPromise;
                applyTheme(aiData.theme);
                showResults(trip, aiData.itinerary);
            } catch (err) {
                console.error("AI generation failed:", err);
                showResults(trip, null);
            }
        }, 4500);

    } catch (err) {
        alert("Something went wrong loading your trip!");
    }
}

function showResults(trip, rawItinerary) {

    window.currentTrip = trip;
    window.currentItinerary = rawItinerary;
    if (rawItinerary) {
        document.getElementById("mapBtnContainer").style.display = "block";
    }

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
    addWeatherSuggestions(trip);
}

// Day colors for map pins
const dayColors = ["#f5c518", "#4CAF50", "#2196F3", "#E91E63", "#FF5722", "#9C27B0"];

// Extract place names from itinerary text
function extractPlaces(rawItinerary, destination) {
    const places = [];
    const lines = rawItinerary.split("\n");
    let currentDay = 1;
    const seen = new Set();

    lines.forEach(function(line) {
        const trimmed = line.trim();
        if (!trimmed) return;

        const dayMatch = trimmed.match(/^Day\s+(\d+)/i);
        if (dayMatch) {
            currentDay = parseInt(dayMatch[1]);
            return;
        }

        const match = trimmed.match(/^(Morning|Afternoon|Evening)\s*[-–]\s*(.+)/i);
        if (!match) return;

        const activity = match[2];

        // Grab any run of 2+ capitalized words — this is how place names show up naturally
        const nounPhrases = activity.match(/[A-Z][a-zA-Z]*(?:[\s-][A-Z][a-zA-Z]*)+/g) || [];

        nounPhrases.forEach(function(phrase) {
            const clean = phrase.trim();
            const key = clean.toLowerCase() + "_" + currentDay;
            if (!seen.has(key)) {
                seen.add(key);
                places.push({
                    name: clean,
                    activity: activity,
                    day: currentDay
                });
            }
        });
    });

    return places;
}

// Get coordinates from OpenStreetMap
async function getCoordinates(placeName, destination) {
    try {
        const query = encodeURIComponent(placeName + " " + destination);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
        const response = await fetch(url, {
            headers: { "Accept-Language": "en" }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                name: placeName
            };
        }
        return null;
    } catch (err) {
        return null;
    }
}

// Initialize and show map
async function showMap(trip, rawItinerary) {
    document.getElementById("mapSection").style.display = "block";
    document.getElementById("showMapBtn").textContent = "⏳ Loading map...";
    document.getElementById("showMapBtn").disabled = true;

    // Get destination coordinates first
    const destCoords = await getCoordinates(trip.destination, "");
    if (!destCoords) {
        alert("Couldn't load map for this destination!");
        document.getElementById("showMapBtn").textContent = "📍 View Itinerary on Map";
        document.getElementById("showMapBtn").disabled = false;
        return;
    }

    // Initialize map
    const map = L.map("map").setView([destCoords.lat, destCoords.lng], 12);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    // Extract places and get coordinates
    const places = extractPlaces(rawItinerary, trip.destination);

    // Add destination marker first
    L.marker([destCoords.lat, destCoords.lng])
        .addTo(map)
        .bindPopup(`<b>📍 ${trip.destination}</b><br>Your destination`)
        .openPopup();

    // Add pins for each place
    let foundCount = 0;
    for (const place of places) {
        await new Promise(resolve => setTimeout(resolve, 1100)); // respect Nominatim rate limit
        const coords = await getCoordinates(place.name, trip.destination);
        if (coords) {
            foundCount++;
            const color = dayColors[(place.day - 1) % dayColors.length];

            // Custom colored marker
            const markerIcon = L.divIcon({
                html: `<div style="
                    background: ${color};
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                "></div>`,
                iconSize: [14, 14],
                className: ""
            });

            L.marker([coords.lat, coords.lng], { icon: markerIcon })
                .addTo(map)
                .bindPopup(`<b>Day ${place.day}</b><br>${place.activity}`);
        }
    }

    document.getElementById("showMapBtn").textContent = `✅ Map Loaded (${foundCount} locations found)`;
    document.getElementById("showMapBtn").disabled = false;

    // Scroll to map
    document.getElementById("mapSection").scrollIntoView({ behavior: "smooth" });
}
//adding some extra content here 
// ===== Weather Suggestions =====
function getWeatherInfo(code) {
    const map = {
        0:  { icon: "☀️", label: "Clear sky",      suggestion: "Perfect day for gardens, parks, and outdoor sightseeing." },
        1:  { icon: "🌤️", label: "Mostly clear",   suggestion: "Great weather for outdoor spots and viewpoints." },
        2:  { icon: "⛅", label: "Partly cloudy",   suggestion: "Good for outdoor exploring, carry light layers." },
        3:  { icon: "☁️", label: "Overcast",        suggestion: "Decent for outdoor walks, but keep an indoor backup handy." },
        45: { icon: "🌫️", label: "Foggy",          suggestion: "Visibility may be low — museums, cafés, or malls are safer bets." },
        48: { icon: "🌫️", label: "Foggy",          suggestion: "Visibility may be low — museums, cafés, or malls are safer bets." },
        51: { icon: "🌦️", label: "Light drizzle",  suggestion: "Keep an umbrella; indoor markets or cafés work well." },
        53: { icon: "🌦️", label: "Drizzle",        suggestion: "Keep an umbrella; indoor markets or cafés work well." },
        55: { icon: "🌦️", label: "Dense drizzle",  suggestion: "Best to plan indoor activities like museums or malls." },
        56: { icon: "🌦️", label: "Freezing drizzle", suggestion: "Stay indoors — cafés, museums, or galleries." },
        57: { icon: "🌦️", label: "Freezing drizzle", suggestion: "Stay indoors — cafés, museums, or galleries." },
        61: { icon: "🌧️", label: "Light rain",     suggestion: "Great day for museums, cafés, or indoor markets." },
        63: { icon: "🌧️", label: "Rain",           suggestion: "Plan indoor activities — museums, malls, or local eateries." },
        65: { icon: "🌧️", label: "Heavy rain",     suggestion: "Stay indoors — explore museums, cafés, or shopping areas." },
        66: { icon: "🌧️", label: "Freezing rain",  suggestion: "Stay indoors and warm — cafés or museums recommended." },
        67: { icon: "🌧️", label: "Freezing rain",  suggestion: "Stay indoors and warm — cafés or museums recommended." },
        71: { icon: "❄️", label: "Light snow",     suggestion: "Cozy indoor spots like cafés or local eateries are ideal." },
        73: { icon: "❄️", label: "Snow",           suggestion: "Cozy indoor spots like cafés or local eateries are ideal." },
        75: { icon: "❄️", label: "Heavy snow",     suggestion: "Best to stay indoors — museums or warm cafés." },
        77: { icon: "❄️", label: "Snow grains",    suggestion: "Best to stay indoors — museums or warm cafés." },
        80: { icon: "🌧️", label: "Rain showers",   suggestion: "Keep plans flexible; indoor markets or cafés as backup." },
        81: { icon: "🌧️", label: "Rain showers",   suggestion: "Keep plans flexible; indoor markets or cafés as backup." },
        82: { icon: "🌧️", label: "Violent showers", suggestion: "Stay indoors — museums, malls, or cafés." },
        85: { icon: "❄️", label: "Snow showers",   suggestion: "Cozy indoor spots recommended." },
        86: { icon: "❄️", label: "Snow showers",   suggestion: "Cozy indoor spots recommended." },
        95: { icon: "⛈️", label: "Thunderstorm",   suggestion: "Stay indoors — avoid outdoor plans today." },
        96: { icon: "⛈️", label: "Thunderstorm with hail", suggestion: "Stay indoors — avoid outdoor plans today." },
        99: { icon: "⛈️", label: "Severe thunderstorm",    suggestion: "Stay indoors — avoid outdoor plans today." }
    };
    return map[code] || { icon: "🌡️", label: "Weather", suggestion: "Check local conditions before heading out." };
}

async function addWeatherSuggestions(trip) {
    try {
        const destCoords = await getCoordinates(trip.destination, "");
        if (!destCoords) return;

        const forecastDays = Math.min(trip.duration, 16);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${destCoords.lat}&longitude=${destCoords.lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=${forecastDays}`;

        const res = await fetch(url);
        const data = await res.json();
        if (!data.daily) return;

        const dayBlocks = document.querySelectorAll(".day-block");
        dayBlocks.forEach(function(block) {
            const h3 = block.querySelector("h3");
            if (!h3) return;
            const match = h3.textContent.match(/Day\s+(\d+)/i);
            if (!match) return;

            const idx = parseInt(match[1]) - 1;
            if (idx < 0 || idx >= data.daily.time.length) return;

            const code = data.daily.weathercode[idx];
            const tmax = Math.round(data.daily.temperature_2m_max[idx]);
            const tmin = Math.round(data.daily.temperature_2m_min[idx]);
            const info = getWeatherInfo(code);

            const weatherDiv = document.createElement("div");
            weatherDiv.className = "weather-suggestion";
            weatherDiv.innerHTML = `
                <span class="weather-icon">${info.icon}</span>
                <span class="weather-text"><strong>${info.label}</strong> (${tmin}°–${tmax}°C) — ${info.suggestion}</span>
            `;
            block.appendChild(weatherDiv);
        });
    } catch (err) {
        console.error("Weather fetch failed:", err);
    }
}
// Build a plain-text weather summary to send to the AI
async function getWeatherSummary(destination, duration) {
    try {
        const destCoords = await getCoordinates(destination, "");
        if (!destCoords) return "Weather forecast unavailable — plan a balanced mix of indoor and outdoor activities.";

        const forecastDays = Math.min(duration, 16);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${destCoords.lat}&longitude=${destCoords.lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=${forecastDays}`;

        const res = await fetch(url);
        const data = await res.json();
        if (!data.daily) return "Weather forecast unavailable — plan a balanced mix of indoor and outdoor activities.";

        let summary = "";
        data.daily.time.forEach(function(date, i) {
            const info = getWeatherInfo(data.daily.weathercode[i]);
            const tmax = Math.round(data.daily.temperature_2m_max[i]);
            const tmin = Math.round(data.daily.temperature_2m_min[i]);
            summary += `Day ${i + 1}: ${info.label}, ${tmin}-${tmax}°C. `;
        });

        return summary.trim();
    } catch (err) {
        return "Weather forecast unavailable — plan a balanced mix of indoor and outdoor activities.";
    }
}

// ===== Kick everything off =====
loadTrip();

document.getElementById("showMapBtn").addEventListener("click", function() {
    if (window.currentTrip && window.currentItinerary) {
        showMap(window.currentTrip, window.currentItinerary);
    }
});



