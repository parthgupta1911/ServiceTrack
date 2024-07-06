const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user");
const Vehicle = require("../models/vehicle");
const Service = require("../models/service");
const bcrypt = require("bcrypt");
const { sendMail } = require("./../utils/sendemail");
const generateOTP = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};
exports.validateJwt = async (req, res) => {
  try {
    const token = req.body.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication token is required" });
    }
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ err, message: "Invalid or expired token" });
      }
      const user = await User.findOne({ email: decoded.email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user._id = undefined;
      user.password = undefined;
      user.otp = undefined;
      res.status(200).json({
        user,
      });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password incorrect" });
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res
      .status(200)
      .json({ message: "Login successful", role: user.role, token });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
exports.markasdone = async (req, res) => {
  const { serviceId } = req.body;

  try {
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    service.status = "done";
    await service.save();

    const vehicle = await Vehicle.findById(service.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    vehicle.lastService = new Date();

    const nextServiceDate = new Date();
    nextServiceDate.setFullYear(nextServiceDate.getFullYear() + 1);
    vehicle.nextService = nextServiceDate;

    await vehicle.save();

    const owner = await User.findById(vehicle.owner);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const emailContent = `
      Our mechanic has finished servicing your vehicle with registration number ${
        vehicle.registrationNumber
      }.
      Please pick it up at your earliest convenience.

      Next service is scheduled for ${nextServiceDate.toDateString()}.
    `;

    await sendMail({
      to: owner.email,
      subject: "Vehicle Service Completed",
      text: emailContent,
    });

    res.status(200).json({ message: "Service marked as done successfully" });
  } catch (error) {
    console.error("Error marking service as done:", error);
    res.status(500).json({ message: "Failed to mark service as done" });
  }
};
exports.authjwt = async (req, res, next) => {
  const token = req.body.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication token is required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    try {
      const user = await User.findOne({ email: decoded.email }).select(
        "-password -otp"
      );
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "email is already registered" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "user",
      vehicles: [],
    });

    await newUser.save();

    const token = jwt.sign({ email: newUser.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    await sendMail({
      to: email,
      subject: "Welcome to ServiceTrack",
      text: "Thank you for signing up! \n Do'nt forget to add your veichles",
    });
    return res.status(201).json({
      message: "User created successfully",
      role: newUser.role,
      token,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
exports.changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();

    user.otp = {
      code: otp,
      expiresIn: new Date(Date.now() + 5 * 60 * 1000), // OTP expires in 5 minutes
    };
    await user.save();

    await sendMail({
      to: email,
      subject: "OTP to reset password",
      text: `${otp} is your one time password to reset your password it's valid for the next 5 mins`,
    });
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
exports.resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp || user.otp.code !== otp || user.otp.expiresIn < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    user.password = hashedPassword;
    user.otp = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in reset password:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
const generateRandomPassword = () => {
  return crypto.randomBytes(4).toString("hex");
};
exports.addMech = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can add mechanics" });
    }

    const { mechName, mechEmail } = req.body;
    if (!mechName || !mechEmail) {
      return res.status(500).json({
        message: "please provide mechanics name and email",
      });
    }
    const existingUser = await User.findOne({ email: mechEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const password = generateRandomPassword();
    console.log(password);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newMech = new User({
      email: mechEmail,
      password: hashedPassword,
      role: "mechanic",
      name: mechName,
    });

    await newMech.save();

    await sendMail({
      to: mechEmail,
      subject: "Welcome to our company ServiceTrack!",
      text: `Thanks for joining our esteemed company. You can login using these credentials:
      
Email: ${mechEmail}
Password: ${password}

After logging in, please reset your password.`,
    });

    res.status(201).json({ message: "Mechanic added successfully" });
  } catch (error) {
    console.error("Error adding mechanic:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.addVech = async (req, res) => {
  try {
    const { type, make, model, year, registrationNumber, lastService } =
      req.body;

    if (
      !type ||
      !make ||
      !model ||
      !year ||
      !registrationNumber ||
      !lastService
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const lastServiceDate = new Date(lastService);
    let nextServiceDate = new Date(lastServiceDate);
    nextServiceDate.setFullYear(lastServiceDate.getFullYear() + 1);

    const today = new Date();
    if (nextServiceDate < today) {
      nextServiceDate = today;
    }

    const newVehicle = new Vehicle({
      type,
      make,
      model,
      year,
      registrationNumber,
      owner: req.user._id,
      lastService: lastServiceDate,
      nextService: nextServiceDate,
    });

    const savedVehicle = await newVehicle.save();

    req.user.vehicles.push(savedVehicle._id);
    await req.user.save();

    await sendMail({
      to: req.user.email,
      subject: "Vehicle Details Saved",
      text: `We have saved your vehicle's details. It should next get serviced by ${nextServiceDate.toDateString()}.`,
    });

    res
      .status(201)
      .json({ message: "Vehicle added successfully", vehicle: savedVehicle });
  } catch (error) {
    console.error("Error adding Vehicle:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getVech = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user._id }).select(
      "registrationNumber"
    );
    const registrationNumbers = vehicles.map(
      (vehicle) => vehicle.registrationNumber
    );
    res.status(200).json({
      message: "Vehicles retrieved successfully",
      registrationNumbers,
    });
  } catch (error) {
    console.error("Error retrieving vehicles:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getService = async (req, res) => {
  try {
    if (req.user.role !== "mechanic") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(today);
    const services = await Service.find({
      mechId: req.user._id,
      status: "scheduled",
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    }).populate({
      path: "vehicleId",
      select: "registrationNumber owner",
      populate: {
        path: "owner",
        select: "name email",
      },
    });
    const serviceDetails = services.map((service) => ({
      _id: service._id,
      ownerName: service.vehicleId.owner.name,
      ownerEmail: service.vehicleId.owner.email,
      registrationNumber: service.vehicleId.registrationNumber,
      time: service.time,
    }));

    res.json({ services: serviceDetails });
  } catch (error) {
    console.error("Error fetching today's services:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.addService = async (req, res) => {
  try {
    const { registrationNumber, date, time } = req.body;
    const ownerId = req.user._id;

    const vehicle = await Vehicle.findOne({ registrationNumber });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const vehicleId = vehicle._id;

    const mechanics = await User.find({
      role: "mechanic",
    });

    if (mechanics.length === 0) {
      return res.status(404).json({
        message: "No mechanics available for the given date and time",
      });
    }
    const randomIndex = Math.floor(Math.random() * mechanics.length);
    const selectedMechanic = mechanics[randomIndex];

    const mechId = mechanics[randomIndex]._id;

    const newService = new Service({
      ownerId,
      vehicleId,
      mechId,
      date,
      time,
      status: "scheduled",
    });

    await newService.save();

    vehicle.services.push(newService._id);
    await vehicle.save();

    let dropoffTime, pickupTime;
    if (time === "morning") {
      dropoffTime = "9-10am";
      pickupTime = "11-12pm";
    } else if (time === "afternoon") {
      dropoffTime = "1-2pm";
      pickupTime = "3-4pm";
    } else if (time === "evening") {
      dropoffTime = "5-6pm";
      pickupTime = "7-8pm";
    }

    const owner = await User.findById(ownerId);
    const ownerEmail = owner.email;

    await sendMail({
      to: ownerEmail,
      subject: "Your vehicle service is scheduled",
      text: `Your vehicle with registration number ${registrationNumber} is scheduled for service.

Service Details:
Date: ${date}
Time: ${time}
Drop-off Time: ${dropoffTime}
Pick-up Time: ${pickupTime}

Mechanic Details:
Name: ${selectedMechanic.name}
Email: ${selectedMechanic.email}

Thank you for using our service.`,
    });

    res.status(201).json({ message: "Service scheduled successfully" });
  } catch (error) {
    console.error("Error adding service:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
