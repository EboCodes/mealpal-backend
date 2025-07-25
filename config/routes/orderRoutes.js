const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Meal = require("../models/Meal");

// ✅ POST /api/orders - Save a new order
router.post("/", async (req, res) => {
  try {
    const {
      userEmail,
      items,
      total,
      delivery,
      deliveryAddress,
      phoneNumber
    } = req.body;

    const order = new Order({
      userEmail,
      items,
      total,
      delivery,
      deliveryAddress,
      phoneNumber,
    });

    await order.save();

    // ✅ Increment purchaseCount for each meal
    for (const item of items) {
      await Meal.findByIdAndUpdate(
        item.mealId, // assumes each item has mealId
        { $inc: { purchaseCount: item.quantity || 1 } }
      );
    }

    res.status(201).json(order);
  } catch (err) {
    console.error("Order save error:", err);
    res.status(500).json({ message: "Failed to save order" });
  }
});

// ✅ GET /api/orders/:email - Get all orders by a user
router.get("/:email", async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET /api/orders/vendor/:vendorName - Vendor-specific orders
router.get("/vendor/:vendorName", async (req, res) => {
  const { vendorName } = req.params;
  try {
    const orders = await Order.find({
      "items.vendor": vendorName
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Vendor order fetch error:", err);
    res.status(500).json({ message: "Failed to fetch vendor orders" });
  }
});

// PATCH /api/orders/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});



module.exports = router;
