const mongoose = require("mongoose");

const MealSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    img: String,
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },
    school: String,
    purchaseCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meal", MealSchema);
