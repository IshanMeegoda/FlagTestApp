const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect("mongodb+srv://foodApp:2001@cluster0.afkbz0b.mongodb.net/country?retryWrites=true&w=majority&appName=Cluster0");

// User Schema
const User = mongoose.model("User", {
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    favoriteCountries: [{
        code: String,
        name: String,
        flag: String,
        region: String
    }]
});

// Middleware
app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// User Registration
app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ error: "Email is already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
        email,
        password: hashedPassword,
        favoriteCountries: []
    });

    try {
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: "Failed to register user" });
    }
});

// User Login with JWT Authentication
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ error: "User not found" });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
        // Create JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.status(200).json({
            message: "Login successful",
            token: token,
            userId: user._id,
            email: user.email,
        });
    } else {
        res.status(400).json({ error: "Incorrect password" });
    }
});

// Middleware to verify JWT Token with Bearer prefix
function verifyToken(req, res, next) {
    const authHeader = req.header("Authorization");
    
    if (!authHeader) {
        return res.status(401).json({ error: "Access denied. No token provided" });
    }

    // Check if the header has the Bearer prefix
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: "Invalid token format. Use Bearer <token>" });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
}

// Protected Route - Profile
app.get("/profile", verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.status(200).json({
            email: user.email,
            userId: user._id,
            favoriteCount: user.favoriteCountries ? user.favoriteCountries.length : 0,
            message: "Welcome to your profile"
        });
    } catch (err) {
        console.error("Error fetching profile:", err);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// Get user's favorite countries
app.get("/favorites", verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.status(200).json(user.favoriteCountries || []);
    } catch (err) {
        console.error("Error fetching favorites:", err);
        res.status(500).json({ error: "Failed to fetch favorites" });
    }
});

// Add a country to favorites
app.post("/favorites", verifyToken, async (req, res) => {
    try {
        const { code, name, flag, region } = req.body;
        const userId = req.user.userId;
        
        if (!code || !name || !flag) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Check if country already exists in favorites
        const exists = user.favoriteCountries.some(country => country.code === code);
        if (exists) {
            return res.status(400).json({ error: "Country already in favorites" });
        }
        
        // Add to favorites
        user.favoriteCountries.push({ code, name, flag, region });
        await user.save();
        
        res.status(201).json(user.favoriteCountries);
    } catch (err) {
        console.error("Error adding favorite:", err);
        res.status(500).json({ error: "Failed to add favorite" });
    }
});

// Remove a country from favorites
app.delete("/favorites/:code", verifyToken, async (req, res) => {
    try {
        const { code } = req.params;
        const userId = req.user.userId;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Check if country exists in favorites
        const exists = user.favoriteCountries.some(country => country.code === code);
        if (!exists) {
            return res.status(404).json({ error: "Country not found in favorites" });
        }
        
        // Remove from favorites
        user.favoriteCountries = user.favoriteCountries.filter(
            country => country.code !== code
        );
        
        await user.save();
        
        res.status(200).json(user.favoriteCountries);
    } catch (err) {
        console.error("Error removing favorite:", err);
        res.status(500).json({ error: "Failed to remove favorite" });
    }
});

// Check if a country is in favorites
app.get("/favorites/:code", verifyToken, async (req, res) => {
    try {
        const { code } = req.params;
        const userId = req.user.userId;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        const isFavorite = user.favoriteCountries.some(country => country.code === code);
        
        res.status(200).json({ isFavorite });
    } catch (err) {
        console.error("Error checking favorite status:", err);
        res.status(500).json({ error: "Failed to check favorite status" });
    }
});

// Start server
app.listen(port, () => {
    console.log(`User service started at http://localhost:${port}`);
});
