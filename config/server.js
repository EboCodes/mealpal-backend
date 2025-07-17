const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🌩️ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

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
app.use("/api/orders", require("./routes/orderRoutes")); // ✅ Orders route

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("MealPal API is running 🚀");
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
