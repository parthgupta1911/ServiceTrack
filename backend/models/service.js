const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
  },
  cost: {
    type: Number,
  },
  mechId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    enum: ["morning", "afternoon", "evening"],

    required: true,
  },
  status: {
    type: String,
    enum: ["scheduled", "done"],
    required: true,
  },
});

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
