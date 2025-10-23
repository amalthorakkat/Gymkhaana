const express = require("express");
const router = express.Router();

const {
  startTrial,
  createOrder,
  getMySubscription,
  verifyPayment,
} = require("../controllers/subscriptionController");
const { authenticateGymOwner } = require("../middlewares/authMiddleware");

router.post("/start-trial", authenticateGymOwner, startTrial);
router.post("/create-order", authenticateGymOwner, createOrder);
router.post("/verify-payment", authenticateGymOwner, verifyPayment);
router.get("/my-subscription", authenticateGymOwner, getMySubscription);

module.exports = router;
