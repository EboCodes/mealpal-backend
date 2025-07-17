const mongoose = require("mongoose");

const MealSchema = new mongoose.Schema({
  name: { type: String, required: true },
  vendor: { type: String, required: true },
  price: { type: Number, required: true },
  img: { type: String, required: true },
});

module.exports = mongoose.model("Meal", MealSchema);
