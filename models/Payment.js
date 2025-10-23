const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    gymOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GymOwner",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["online", "cash"],
      required: true,
    },
    // Razorpay details (only used for online payments)
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    // Common status for both cash and online
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
