const mongoose = require("mongoose");

const gymOwnerSubscriptionSchema = new mongoose.Schema(
  {
    gymOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GymOwner",
      required: true,
    },
    planType: {
      type: String,
      enum: ["trial", "monthly", "yearly"],
      default: "trial",
    },
    amount: {
      type: Number,
      default: 0, // 0 for trial, 499 for monthly, 5000 for yearly
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  { timestamps: true }
);

// Automatically calculate subscription end date
gymOwnerSubscriptionSchema.pre("save", function (next) {
  if (!this.endDate) {
    const start = new Date(this.startDate);
    if (this.planType === "trial") start.setDate(start.getDate() + 7);
    else if (this.planType === "monthly") start.setMonth(start.getMonth() + 1);
    else if (this.planType === "yearly")
      start.setFullYear(start.getFullYear() + 1);
    this.endDate = start;
  }
  next();
});

module.exports = mongoose.model(
  "GymOwnerSubscription",
  gymOwnerSubscriptionSchema
);
