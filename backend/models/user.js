const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: true,
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "mechanic", "user"],
    required: true,
  },
  vehicles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
    },
  ],
  otp: {
    code: {
      type: String,
    },
    expiresIn: {
      type: Date,
    },
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
