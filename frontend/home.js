const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/frontend/login.html";
}

const popularDestinations = [
    { name: "Goa", image: "images/beach.jpg" },
    { name: "Manali", image: "images/mountain.jpg" },
    { name: "Mumbai", image: "images/city.jpg" },
    { name: "Jaisalmer", image: "images/desert.jpg" }
];

function loadDestinations() {
    const grid = document.getElementById("destinationGrid");
    popularDestinations.forEach(function(dest) {
        grid.innerHTML += `
            <div class="destination-card" onclick="selectDestination('${dest.name}')">
                <img src="${dest.image}" alt="${dest.name}">
                <div class="info">
                    <h3>${dest.name}</h3>
                </div>
            </div>
        `;
    });
}

function selectDestination(name) {
    const destInput = document.getElementById("destination");
    destInput.value = name;
    destInput.scrollIntoView({ behavior: "smooth", block: "center" });
    destInput.style.borderColor = "#f5c518";
    destInput.focus();
}

async function getUserInfo() {
    const response = await fetch("http://localhost:8000/api/auth/me", {
        method: "GET",
        headers: { "Authorization": "Bearer " + token }
    });
    const data = await response.json();
    if (response.ok) {
        document.getElementById("welcomeUser").textContent = "Welcome, " + data.name + "!";
    } else {
        window.location.href = "/frontend/login.html";
    }
}

async function getTrips() {
    const response = await fetch("http://localhost:8000/api/trips", {
        method: "GET",
        headers: { "Authorization": "Bearer " + token }
    });
    const trips = await response.json();
    const tripsList = document.getElementById("tripsList");
    tripsList.innerHTML = "";

    if (trips.length === 0) {
        tripsList.innerHTML = "<p>No trips yet! Create one above.</p>";
        return;
    }

    trips.forEach(function(trip) {
        tripsList.innerHTML += `
            <div class="trip-card">
                <h3>${trip.destination}</h3>
                <p>Budget: ₹${trip.budget}</p>
                <p>Duration: ${trip.duration} days</p>
                <p>Interests: ${trip.interests.join(", ")}</p>
                <p>Pace: ${trip.travelPace}</p>
                <button onclick="deleteTrip('${trip._id}')">Delete</button>
            </div>
        `;
    });
}

document.getElementById("createTrip").addEventListener("click", async function() {
    const destination = document.getElementById("destination").value;
    const budget = document.getElementById("budget").value;
    const duration = document.getElementById("duration").value;
    const interests = document.getElementById("interests").value.split(",").map(i => i.trim());
    const travelPace = document.getElementById("travelPace").value;

    const response = await fetch("http://localhost:8000/api/trips", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ destination, budget, duration, interests, travelPace })
    });

    const data = await response.json();
    if (response.ok) {
        window.location.href = "/frontend/itinerary.html?tripId=" + data.trip._id;
    } else {
        alert(data.message);
    }
});

async function deleteTrip(id) {
    const response = await fetch("http://localhost:8000/api/trips/" + id, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
    const data = await response.json();
    if (response.ok) {
        alert("Trip deleted!");
        getTrips();
    } else {
        alert(data.message);
    }
}

document.getElementById("logoutbtn").addEventListener("click", function() {
    localStorage.removeItem("token");
    window.location.href = "/frontend/login.html";
});

loadDestinations();
getUserInfo();
getTrips();