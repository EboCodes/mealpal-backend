const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "vendor"],
    default: "user",
  },

  // ✅ Add school field
  school: {
    type: String,
    required: false, // You can make this true later if needed
  },

  // ✅ Vendor profile fields
  description: {
    type: String,
    default: "Delicious meals made with love and care.",
  },
  coverImage: {
    type: String,
    default: "",
  },

  // ✅ Ratings system
  ratings: {
    type: [Number],
    default: [],
  }
});

// 🧠 Method to compute average rating
userSchema.methods.getAverageRating = function () {
  if (!this.ratings || this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, r) => acc + r, 0);
  const average = sum / this.ratings.length;
  return Math.round(average * 10) / 10;
};

module.exports = mongoose.model("User", userSchema);
