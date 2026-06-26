const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const tripRoutes = require("./routes/trips");
const itineraryRoutes = require("./routes/itinerary");  // ← new

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/test-post", (req, res) => {
    res.json({ message: "POST working!", body: req.body });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected!");
    })
    .catch((err) => {
        console.log("MongoDB connection failed:", err);
    });

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/itinerary", itineraryRoutes);  // ← new

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});