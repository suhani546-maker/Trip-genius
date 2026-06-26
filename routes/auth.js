const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");






//signup route
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists!" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user to database
        const newUser = new User({
            name: name,
            email: email,
            password: hashedPassword
        });
        await newUser.save();

        res.status(201).json({ message: "User created successfully!" });

    } catch (err) {
        res.status(500).json({ message: "Something went wrong!", error: err.message });
    }
});
// Login route

    router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Wrong password!" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful!",
            token: token
        });

    } catch (err) {
        res.status(500).json({ message: "Something went wrong!", error: err.message });
    }
});

router.get("/me", async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        res.status(200).json({ name: user.name, email: user.email });
    } catch (err) {
        res.status(401).json({ message: "Unauthorized!" });
    }
});
module.exports = router;
