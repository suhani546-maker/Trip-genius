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



// =============================
// THEME PDF DOWNLOAD
// =============================

const pdfScript = document.createElement("script");

pdfScript.src =
"https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";


pdfScript.onload = function () {

    document.getElementById("downloadPDF").onclick = function () {

        const { jsPDF } = window.jspdf;

        const doc = new jsPDF();


        let body = document.getElementById("itineraryBody");

        let bgImage = "";


        if (body.classList.contains("theme-beach")) {
            bgImage = "images/beach.jpg";
        }

        else if (body.classList.contains("theme-mountain")) {
            bgImage = "images/mountain.jpg";
        }

        else if (body.classList.contains("theme-desert")) {
            bgImage = "images/desert.jpg";
        }

        else if (body.classList.contains("theme-urban")) {
            bgImage = "images/urban.jpg";
        }



        function createPDF() {

            // Background color fallback
            doc.setFillColor(245,245,245);
            doc.rect(0,0,210,297,"F");


            // Header
            doc.setFillColor(30,120,200);
            doc.roundedRect(10,10,190,35,5,5,"F");


            doc.setTextColor(255,255,255);
            doc.setFontSize(24);

            doc.text(
                "TripGenius",
                20,
                32
            );


            // White content card

            doc.setFillColor(255,255,255);

            doc.roundedRect(
                15,
                60,
                180,
                170,
                8,
                8,
                "F"
            );


            doc.setTextColor(40,40,40);


            doc.setFontSize(18);

            doc.text(
                "Travel Itinerary",
                25,
                85
            );


            doc.setFontSize(13);


            let destination =
            document.getElementById("tripTitle").innerText;


            doc.text(
                "Destination: " + destination,
                25,
                105
            );


            let itinerary =
            document.getElementById("itineraryContent").innerText;


            let lines =
            doc.splitTextToSize(
                itinerary,
                160
            );


            doc.setFontSize(11);

            doc.text(
                lines,
                25,
                125
            );


            doc.setTextColor(120,120,120);

            doc.setFontSize(10);

            doc.text(
                "Generated by TripGenius AI",
                25,
                270
            );


            doc.save(
                "TripGenius-Itinerary.pdf"
            );

        }



        // Add background image if available

        if(bgImage){

            let img = new Image();

            img.src = bgImage;


            img.onload = function(){

                doc.addImage(
                    img,
                    "JPEG",
                    0,
                    0,
                    210,
                    297
                );

                createPDF();

            };


            img.onerror = function(){

                console.log("Image not found:", bgImage);

                createPDF();

            };


        }

        else {

            createPDF();

        }


    };

};


document.head.appendChild(pdfScript);
