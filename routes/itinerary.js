const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ message: "Unauthorized!" });
    }
}

router.post("/generate", authMiddleware, async (req, res) => {
    try {
        const { destination, budget, duration, interests, travelPace } = req.body;

        const prompt = `You are a travel planner. For the destination "${destination}", do two things:

1. Classify the destination's landscape into exactly ONE of these four types: beach, mountain, desert, urban. Pick whichever best matches the dominant scenery/vibe.

2. Generate a detailed ${duration}-day travel itinerary.
Budget: ₹${budget}
Interests: ${interests.join(", ")}
Travel Pace: ${travelPace}

Respond in EXACTLY this format, nothing else:

THEME: <beach|mountain|desert|urban>
---
Day 1:
Morning - activity
Afternoon - activity
Evening - activity

Day 2:
Morning - activity
Afternoon - activity
Evening - activity

(continue for all ${duration} days)

Keep it realistic, practical, and within budget. No extra explanation outside this format.`;

        const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + process.env.HF_API_KEY
            },
            body: JSON.stringify({
                model: "moonshotai/Kimi-K2-Instruct-0905",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        const fullText = data.choices[0].message.content;

        // Split theme from itinerary
        const parts = fullText.split("---");
        const themeLine = parts[0].trim();
        const itineraryText = parts.slice(1).join("---").trim();

        let theme = "default";
        const match = themeLine.match(/THEME:\s*(beach|mountain|desert|urban)/i);
        if (match) {
            theme = match[1].toLowerCase();
        }

        res.status(200).json({ itinerary: itineraryText, theme: theme });

    } catch (err) {
        res.status(500).json({ message: "Something went wrong!", error: err.message });
    }
});

module.exports = router;