// models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true },
    items: [
      {
        name: String,
        price: Number,
        vendor: String,
        img: String,
        quantity: { type: Number, default: 1 },
      }
    ],
    total: Number,
    delivery: { type: Boolean, default: false },
    deliveryAddress: String,
    phoneNumber: String,
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Preparing", "Delivered"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
