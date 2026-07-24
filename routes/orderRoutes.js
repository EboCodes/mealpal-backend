const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Meal = require("../models/Meal");
const { verifyToken, requireRole } = require("../middleware/auth");

// ✅ POST /api/orders - Save a new order
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      items,
      total,
      delivery,
      deliveryAddress,
      phoneNumber
    } = req.body;

    // Use the verified token's email, not whatever the client sends
    const userEmail = req.user.email;

    const order = new Order({
      userEmail,
      items,
      total,
      delivery,
      deliveryAddress,
      phoneNumber,
    });

    await order.save();

    // ✅ Increment purchaseCount for each meal (handles both _id and mealId field names)
    for (const item of items) {
      const mealId = item._id || item.mealId;
      const quantity = item.quantity || 1;

      if (mealId) {
        await Meal.findByIdAndUpdate(
          mealId,
          { $inc: { purchaseCount: quantity } },
          { new: true }
        );
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
router.get("/:email", verifyToken, async (req, res) => {
  try {
    const isSelf = req.user.email?.toLowerCase() === req.params.email.toLowerCase();
    if (!isSelf && req.user.role !== "vendor") {
      return res.status(403).json({ message: "Not authorized to view these orders" });
    }

    const orders = await Order.find({ userEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET /api/orders/vendor/:vendorName - Vendor-specific orders
router.get("/vendor/:vendorName", verifyToken, requireRole("vendor"), async (req, res) => {
  const { vendorName } = req.params;

  if (req.user.name !== vendorName) {
    return res.status(403).json({ message: "Not authorized to view these orders" });
  }

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
router.patch("/:id/status", verifyToken, requireRole("vendor"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const ownsItem = order.items.some((item) => item.vendor === req.user.name);
    if (!ownsItem) {
      return res.status(403).json({ message: "Not authorized to update this order" });
    }

    order.status = req.body.status;
    await order.save();

    res.json(order);
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// 🆕 GET /api/orders - Get all orders (admin view)
// NOTE: there's no "admin" role in the User model yet — this is locked to
// "vendor" for now so it's not wide open. Add a real admin role before
// exposing this more broadly.
router.get("/", verifyToken, requireRole("vendor"), async (req, res) => {
  try {
    const { school, status } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    let query = {};
    if (school) query.school = school;
    if (status) query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(query),
    ]);

    res.json({
      orders,
      page,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
    });
  } catch (err) {
    console.error("Fetch all orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
