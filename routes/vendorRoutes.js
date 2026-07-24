const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User");
const { verifyToken, requireRole } = require("../middleware/auth");

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Cloudinary upload helper
const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", folder: "vendor_covers", quality: "auto" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
};

// ✅ PUT /api/vendor/profile - Update vendor profile
router.put("/profile", verifyToken, requireRole("vendor"), upload.single("coverImage"), async (req, res) => {
  try {
    const { description } = req.body;
    let coverImageUrl;

    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      coverImageUrl = result.secure_url;
    }

    const updateData = {
      ...(description && { description }),
      ...(coverImageUrl && { coverImage: coverImageUrl }),
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, // update the logged-in vendor's own profile only
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "Vendor not found" });

    res.json({
      message: "Profile updated",
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        description: updatedUser.description,
        coverImage: updatedUser.coverImage,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET /api/vendor/:name - Get vendor profile by name
router.get("/:name", async (req, res) => {
  try {
    const vendor = await User.findOne({ name: req.params.name });

    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    res.json({
      name: vendor.name,
      email: vendor.email,
      description: vendor.description || "",
      coverImage: vendor.coverImage || "",
      averageRating: vendor.getAverageRating?.() || 0,
    });
  } catch (err) {
    console.error("Fetch vendor error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST /api/vendor/:name/rate - Rate a vendor
router.post("/:name/rate", verifyToken, async (req, res) => {
  try {
    const vendor = await User.findOne({ name: req.params.name });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: "Invalid rating" });

    vendor.ratings.push(rating);
    await vendor.save();

    res.json({
      message: "Rating submitted",
      averageRating: vendor.getAverageRating(),
    });
  } catch (err) {
    console.error("Rating error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET /api/vendor - List all vendors OR filter by school
router.get("/", async (req, res) => {
  try {
    const { school } = req.query;

    const filter = { role: "vendor" };
    if (school) filter.school = school;

    const vendors = await User.find(filter);

    const formatted = vendors.map((v) => ({
      name: v.name,
      description: v.description || "",
      coverImage: v.coverImage || "",
      averageRating: v.getAverageRating?.() || 0,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Fetch vendors error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
