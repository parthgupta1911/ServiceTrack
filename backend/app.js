const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const userRouter = require("./routers/userRouter");

const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.URI.replace("<password>", process.env.PASSWORD);

mongoose.connect(uri).then(() => {
  console.log(`connected to the database`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.use("/api/user", userRouter);

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "ServiceTrack has no such route.",
  });
});
