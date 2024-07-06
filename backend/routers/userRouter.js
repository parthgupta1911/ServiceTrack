const express = require("express");
const userController = require("../controllers/userContoller.js");
const router = express.Router();

router.post("/login", userController.login);
router.post("/signup", userController.signup);
router.post("/resetPassword", userController.changePassword);
router.post("/forgotPassword", userController.forgotPassword);
router.post("/changePassword", userController.resetPassword);
router.post("/validateJwt", userController.validateJwt);
router.post("/addMech", userController.authjwt, userController.addMech);
router.post("/addVech", userController.authjwt, userController.addVech);
router.post("/getVech", userController.authjwt, userController.getVech);
router.post("/addService", userController.authjwt, userController.addService);
router.post("/getService", userController.authjwt, userController.getService);
router.post("/markasdone", userController.authjwt, userController.markasdone);
router.post("/test", (req, res) => {
  res.status(200).json({
    message: "this is a test",
  });
});
// router.post("/admin", userController.addTeacher);

module.exports = router;
