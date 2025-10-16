const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/register", authController.registerGymOwner);
router.post("/verify-signup-otp", authController.verifySignupOTP);

router.post("/login", authController.loginGymOwner);
router.post("/verify-login-otp", authController.verifyLoginOtp);

router.post("/resend-otp", authController.resendOTP);

module.exports = router;
