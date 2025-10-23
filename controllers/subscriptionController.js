const GymOwnerSubscription = require("../models/GymOwnerSubscription");
const GymOwner = require("../models/GymOwner");
const razorpay = require("../config/razorpay");

// Helper to calculate amount
const getPlanAmount = (planType) => {
  switch (planType) {
    case "monthly":
      return 499;
    case "yearly":
      return 5000;
    case "trial":
    default:
      return 0;
  }
};

// ------------------------- CONTROLLERS -------------------------

// @desc    Start free trial for a new gym owner
// @route   POST /api/subscription/start-trial
exports.startTrial = async (req, res) => {
  try {
    const gymOwnerId = req.user.id; // assuming gym owner is authenticated

    // Check if trial already used
    const existingTrial = await GymOwnerSubscription.findOne({
      gymOwnerId,
      planType: "trial",
    });

    if (existingTrial)
      return res.status(400).json({ message: "Trial already used." });

    const trial = new GymOwnerSubscription({
      gymOwnerId,
      planType: "trial",
      amount: 0,
      paymentStatus: "completed",
      isActive: true,
    });

    await trial.save();

    res.status(201).json({
      message: "Trial started successfully.",
      subscription: trial,
    });
  } catch (error) {
    console.error("Error starting trial:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// @desc    Create Razorpay order for subscription
// @route   POST /api/subscription/create-order
exports.createOrder = async (req, res) => {
  try {
    const { planType } = req.body;
    const gymOwnerId = req.user.id;

    const amount = getPlanAmount(planType) * 100; // in paise

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const subscription = await GymOwnerSubscription.create({
      gymOwnerId,
      planType,
      amount: amount / 100,
      razorpayOrderId: order.id,
      paymentStatus: "pending",
      isActive: false,
    });

    res.status(201).json({
      message: "Order created successfully.",
      order,
      subscriptionId: subscription._id,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/subscription/verify-payment
exports.verifyPayment = async (req, res) => {
  try {
    const crypto = require("crypto");
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscriptionId,
    } = req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature." });
    }

    const subscription = await GymOwnerSubscription.findByIdAndUpdate(
      subscriptionId,
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentStatus: "completed",
        isActive: true,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Payment verified successfully.",
      subscription,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// @desc    Get current gym owner's active subscription
// @route   GET /api/subscription/my-subscription
exports.getMySubscription = async (req, res) => {
  try {
    const gymOwnerId = req.user.id;

    const subscription = await GymOwnerSubscription.findOne({
      gymOwnerId,
      isActive: true,
    }).sort({ createdAt: -1 });

    if (!subscription)
      return res.status(404).json({ message: "No active subscription found." });

    res.status(200).json({ subscription });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ message: "Server error." });
  }
};
