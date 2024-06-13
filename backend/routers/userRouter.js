const express = require("express");
const userController = require("../controllers/userContoller.js");
const router = express.Router();

router.post("/login", userController.login);
router.post("/signup", userController.signup);
router.post("/changePassword", userController.changePassword);
router.post("/forgotPassword", userController.forgotPassword);
router.post("/resetPassword", userController.resetPassword);
// router.post("/admin", userController.addTeacher);

module.exports = router;
