const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}
//adding extra here 
 
function showToast(message, type = '', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    // This allows the base 'toast' class plus whatever type you pass (like 'danger')
    toast.className = `toast ${type}`.trim(); 
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => { toast.classList.add('show'); }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { toast.remove(); }, 300);
    }, duration);
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
    const response = await fetch("https://trip-genius.onrender.com/api/auth/me", {
        method: "GET",
        headers: { "Authorization": "Bearer " + token }
    });
    const data = await response.json();
    if (response.ok) {
        // Get the current hour of the user's local clock
        const hour = new Date().getHours();
        let greeting = "Welcome";
        
        if (hour < 12) {
            greeting = "Good morning";
        } else if (hour < 18) {
            greeting = "Good afternoon";
        } else {
            greeting = "Good evening";
        }

        // Set the dynamic greeting + their name
        document.getElementById("welcomeUser").textContent = `${greeting}, ${data.name}!`;
    } else {
        window.location.href = "login.html";
    }
}

async function getTrips() {
    const response = await fetch("https://trip-genius.onrender.com/api/trips", {
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
                <p>Budget: ₹${Number(trip.budget).toLocaleString('en-IN')}</p>
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

    const response = await fetch("https://trip-genius.onrender.com/api/trips", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ destination, budget, duration, interests, travelPace })
    });

     const data = await response.json();
    if (response.ok) {
        window.location.href = "itinerary.html?tripId=" + data.trip._id;
    } else {
        // Replacing the alert with a toast here too
        showToast(data.message || "Failed to create trip", "danger");
    }
});
document.getElementById("demoFillBtn").addEventListener("click", () => {
    // A list of cool preset options to mix it up!
    const demos = [
        { dest: "Goa", budget: "25000", duration: "4", interests: "beaches, seafood, nightlife", pace: "moderate" },
        { dest: "Manali", budget: "30000", duration: "5", interests: "snow, mountains, cafes", pace: "relaxed" },
        { dest: "Jaipur", budget: "20000", duration: "3", interests: "palaces, history, street food", pace: "fast" }
    ];

    // Pick a random demo from the list
    const randomDemo = demos[Math.floor(Math.random() * demos.length)];

    // Fill the inputs
    document.getElementById("destination").value = randomDemo.dest;
    document.getElementById("budget").value = randomDemo.budget;
    document.getElementById("duration").value = randomDemo.duration;
    document.getElementById("interests").value = randomDemo.interests;
    document.getElementById("travelPace").value = randomDemo.pace;

    showToast(`Demo loaded: ${randomDemo.dest}!`);
});

async function deleteTrip(id) {
    const response = await fetch("https://trip-genius.onrender.com/api/trips/" + id, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
    const data = await response.json();
    if (response.ok) {
        showToast("Trip deleted!", "danger"); 
        getTrips();
    } else {
        // Now errors will also show as a red toast instead of a popup!
        showToast(data.message || "Failed to delete trip", "danger");
    }
}


document.getElementById("logoutbtn").addEventListener("click", function() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
});

loadDestinations();
getUserInfo();
getTrips();
