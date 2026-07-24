const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const { validateEnv } = require("./config/validateEnv");
validateEnv(); // fails fast if required env vars are missing

require("./config/cloudinary"); // configures the cloudinary SDK as a side effect

const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();

// ✅ CORS Setup for Vercel Frontend
app.use(cors({
  origin: ["http://localhost:5173", "https://skoolmealpal.vercel.app"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], 
  credentials: true
}));

app.options("*", cors());

app.use(express.json());

// ✅ Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL;

// 🔌 Connect to MongoDB
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error:", err));

// 🔁 API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/meals", require("./routes/mealRoutes"));
app.use("/api/vendor", require("./routes/vendorRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("MealPal API is live!");
});

// 404 + centralized error handling (must be registered last)
app.use(notFoundHandler);
app.use(errorHandler);

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
