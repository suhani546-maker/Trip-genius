const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const jwt = require("jsonwebtoken");

// Middleware to check if user is logged in
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

// Create a trip

    router.post("/", authMiddleware, async (req, res) => {
    try {
        const { destination, budget, duration, interests, travelPace } = req.body;

        const newTrip = new Trip({
            userId: req.userId,
            destination: destination,
            budget: budget,
            duration: duration,
            interests: interests,
            travelPace: travelPace
        });

        await newTrip.save();
        res.status(201).json({ message: "Trip created!", trip: newTrip });

    } catch (err) {
        res.status(500).json({ message: "Something went wrong!", error: err.message });
    }
});



// Get all trips
router.get("/", authMiddleware, async (req, res) => {
    try {
        const trips = await Trip.find({ userId: req.userId });
        res.status(200).json(trips);
    } catch (err) {
        res.status(500).json({ message: "Something went wrong!", error: err.message });
    }
});

// Delete a trip
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const trip = await Trip.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!trip) {
            return res.status(404).json({ message: "Trip not found!" });
        }

        res.status(200).json({ message: "Trip deleted!" });

    } catch (err) {
        res.status(500).json({ message: "Something went wrong!", error: err.message });
    }
});
module.exports = router;