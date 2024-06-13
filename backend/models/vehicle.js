const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["2 wheller", "4 wheller"],
    required: true,
  },
  make: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lastService: {
    type: Date,
    required: false,
  },
  nextService: {
    type: Date,
    required: true,
  },
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;
