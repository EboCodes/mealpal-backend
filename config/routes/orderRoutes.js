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

    console.log("Creating order with items:", items); // Debug log

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
    // 🔧 FIX: Use _id instead of mealId since that's what your cart uses
    for (const item of items) {
      const mealId = item._id || item.mealId; // Handle both field names
      const quantity = item.quantity || 1;
      
      if (mealId) {
        console.log(`Updating purchase count for meal ${mealId} by ${quantity}`); // Debug log
        
        await Meal.findByIdAndUpdate(
          mealId,
          { $inc: { purchaseCount: quantity } },
          { new: true }
        );
      } else {
        console.warn("Item missing meal ID:", item);
      }
    }

    res.status(201).json({
      message: "Order created successfully",
      order: order
    });
  } catch (err) {
    console.error("Order save error:", err);
    res.status(500).json({ message: "Failed to save order", error: err.message });
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

// ✅ PATCH /api/orders/:id/status - Update order status
router.patch("/:id/status", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json(order);
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// 🆕 GET /api/orders - Get all orders (admin view)
router.get("/", async (req, res) => {
  try {
    const { school, status, limit = 50 } = req.query;
    
    let query = {};
    if (school) query.school = school;
    if (status) query.status = status;
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
      
    res.json(orders);
  } catch (err) {
    console.error("Fetch all orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
