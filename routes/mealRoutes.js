const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Meal = require("../models/Meal");
const Vendor = require("../models/User"); // Vendor is from User model

// Multer setup for buffer upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

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

// ✅ GET /api/meals?school=UNILAG&sort=price-desc
router.get("/", async (req, res) => {
  try {
    const { school, sort } = req.query;

    const query = school ? { school } : {};
    let sortOption = { createdAt: -1 };
    if (sort === "price-asc") sortOption = { price: 1 };
    else if (sort === "price-desc") sortOption = { price: -1 };

    const meals = await Meal.find(query)
      .populate("vendor", "name school")
      .sort(sortOption);

    res.json(meals);
  } catch (err) {
    console.error("Fetch meals error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST /api/meals
router.post("/", upload.single("img"), async (req, res) => {
  try {
    const { name, price, vendorId } = req.body;

    if (!name || !price || !vendorId || !req.file)
      return res.status(400).json({ error: "All fields are required" });

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    const result = await streamUpload(req.file.buffer);

    const newMeal = new Meal({
      name,
      price,
      img: result.secure_url,
      vendor: vendor._id,
      school: vendor.school,
    });

    await newMeal.save();
    res.status(201).json(newMeal);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ✅ PUT /api/meals/:id
router.put("/:id", upload.single("img"), async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: "Meal not found" });

    if (req.body.vendor !== String(meal.vendor))
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

// ✅ DELETE /api/meals/:id
router.delete("/:id", async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: "Meal not found" });

    if (req.body.vendor !== String(meal.vendor))
      return res.status(403).json({ message: "Unauthorized" });

    await Meal.findByIdAndDelete(req.params.id);
    res.json({ message: "Meal deleted" });
  } catch (err) {
    console.error("Delete meal error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET /api/meals/featured?school=UNILAG
router.get("/featured", async (req, res) => {
  try {
    const { school } = req.query;
    if (!school) return res.status(400).json({ error: "School is required." });

    const featuredMeals = await Meal.find({ school })
      .sort({ purchaseCount: -1 })
      .limit(6);

    res.json(featuredMeals);
  } catch (err) {
    console.error("Error fetching featured meals:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

module.exports = router;
