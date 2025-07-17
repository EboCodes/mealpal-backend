const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Meal = require("../models/Meal");

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload helper
const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", folder: "meals", quality: "auto" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
};

// GET /api/meals - all meals
router.get("/", async (req, res) => {
  try {
    const meals = await Meal.find().sort({ createdAt: -1 });
    res.json(meals);
  } catch (err) {
    console.error("Fetch meals error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/meals - add new meal
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, price, vendor } = req.body;
    if (!name || !price || !vendor)
      return res.status(400).json({ message: "Missing fields" });

    let imageUrl = "";

    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const newMeal = await Meal.create({
      name,
      price,
      vendor,
      img: imageUrl,
    });

    res.status(201).json(newMeal);
  } catch (err) {
    console.error("Create meal error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/meals/:id - update meal
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: "Meal not found" });

    if (req.body.vendor !== meal.vendor)
      return res.status(403).json({ message: "Unauthorized" });

    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      meal.img = result.secure_url;
    }

    meal.name = req.body.name || meal.name;
    meal.price = req.body.price || meal.price;

    await meal.save();
    res.json(meal);
  } catch (err) {
    console.error("Update meal error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/meals/:id - delete meal
router.delete("/:id", async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: "Meal not found" });

    if (req.body.vendor !== meal.vendor)
      return res.status(403).json({ message: "Unauthorized" });

    await Meal.findByIdAndDelete(req.params.id);
    res.json({ message: "Meal deleted" });
  } catch (err) {
    console.error("Delete meal error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
