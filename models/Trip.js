const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    budget: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    interests: {
        type: [String],
        required: true
    },
    travelPace: {
        type: String,
        enum: ["slow", "moderate", "fast"],
        required: true
    }
}, { timestamps: true });

const Trip = mongoose.model("Trip", tripSchema);

module.exports = Trip;