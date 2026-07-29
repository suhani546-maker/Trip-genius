const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/login.html";
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
        const response = await fetch("https://trip-genius.onrender.com/api/trips", {
            method: "GET",
            headers: { "Authorization": "Bearer " + token }
        });
        const trips = await response.json();
        const trip = trips.find(t => t._id === tripId);

        if (!trip) {
            alert("Trip not found!");
            window.location.href = "/home.html";
            return;
        }

        document.getElementById("loadingDestText").textContent =
            "Packing your bags for " + trip.destination;

        // Start the AI call immediately (it takes a few seconds anyway)
        const aiPromise = fetch("https://trip-genius.onrender.com/api/itinerary/generate", {  // ✅
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

// PDF DOWNLOAD FEATURE



const pdfScript = document.createElement("script");

pdfScript.src =
"https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";


pdfScript.onload = function(){

 document.getElementById("downloadPDF").addEventListener("click", function(){
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Detect website theme

        let body = document.getElementById("itineraryBody");
        let themeColor = [30, 144, 255]; // default blue

        if(body.classList.contains("theme-beach")){
            themeColor = [0, 180, 216];
        }
        else if(body.classList.contains("theme-mountain")){
            themeColor = [34, 139, 34];
        }
        else if(body.classList.contains("theme-desert")){
            themeColor = [210, 140, 40];
        }
        else if(body.classList.contains("theme-urban")){
            themeColor = [90, 90, 90];
        }

        doc.setFillColor(
            themeColor[0],
            themeColor[1],
            themeColor[2]
        );


        doc.rect(
            0,
            0,
            210,
            35,
            "F"
        );


        doc.setTextColor(255,255,255);

        doc.setFontSize(24);

        doc.text(
            "TripGenius",
            20,
            22
        );

     doc.setTextColor(0,0,0);
     doc.setFontSize(16);

        doc.text(
            "Travel Itinerary",
            20,
            55
        );

  let destination =
        document.getElementById("tripTitle").innerText;

  doc.setFontSize(12);

        doc.text(
            "Destination: " + destination,
            20,
            70
        );


        let itinerary =
        document.getElementById("itineraryContent").innerText;

  let lines =
        doc.splitTextToSize(
            itinerary,
            170
        );



        doc.text(
            lines,
            20,
            90
        );
     doc.setFontSize(10);

        doc.setTextColor(120);

        doc.text(
            "Generated by TripGenius AI",
            20,
            285
        );

        doc.save(
            "TripGenius-Itinerary.pdf"
        );
    });
};

document.head.appendChild(pdfScript);
