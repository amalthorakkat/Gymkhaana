const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  verifySignupOTP,
  loginAdmin,
  verifyLoginOtp,
  resendOTP,
} = require("../controllers/adminController");

const {
  getGymOwners,
  getGymOwnerById,
} = require("../controllers/gymOwnerController");
const { getMembersByGymOwner } = require("../controllers/memberController");
const { authenticateAdmin } = require("../middlewares/authMiddleware");

router.post("/register", registerAdmin);
router.post("/verify-signup-otp", verifySignupOTP);
router.post("/login", loginAdmin);
router.post("/verify-login-otp", verifyLoginOtp);
router.post("/resend-otp", resendOTP);

// Admin routes for gym owners
router.get("/gym-owners", authenticateAdmin, getGymOwners);
router.get("/gym-owners/:id", authenticateAdmin, getGymOwnerById);

// Admin route for members of a specific gym owner
router.get(
  "/gym-owners/:gymOwnerId/members",
  authenticateAdmin,
  getMembersByGymOwner
);

module.exports = router;
