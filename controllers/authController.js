const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const GymOwner = require("../models/GymOwner");
const Otp = require("../models/Otp");
const { otpTemplate } = require("../utils/templates/otpTemplate");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-key-change-in-production";
const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter setup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email transporter ready!");
  }
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (email, gymName, otp, purpose = "verification") => {
  try {
    // REMOVED: No longer log the actual OTP value
    console.log(`📧 Sending ${purpose} OTP to ${email} for ${gymName}`);

    const mailOptions = {
      from: `"Gymkhaana" <${process.env.EMAIL_USER}>`,
      to: email,
      subject:
        purpose === "login"
          ? `Gymkhaana Login - ${gymName}`
          : `Gymkhaana - OTP Verification`,
      html: otpTemplate(otp, gymName, purpose),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `✅ ${purpose} OTP sent successfully! Message ID: ${result.messageId}`
    );
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send ${purpose} OTP to ${email}:`,
      error.message
    );
    throw error;
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

// Register Gym Owner
const registerGymOwner = async (req, res) => {
  try {
    const { gymName, email, password, address, contactNumber } = req.body;

    if (!gymName || !email || !password || !address || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingGymOwner = await GymOwner.findOne({ email });
    if (existingGymOwner) {
      return res.status(400).json({
        success: false,
        message: "Gym owner with this email already exists",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const gymOwner = new GymOwner({
      gymName,
      email,
      password: hashedPassword,
      address,
      contactNumber,
      isVerified: false,
    });
    await gymOwner.save();

    const otp = generateOTP();
    const otpDoc = new Otp({
      email,
      otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY),
    });
    await otpDoc.save();

    // Send OTP via email (no console log of OTP)
    await sendOTP(email, gymName, otp, "verification");

    res.status(201).json({
      success: true,
      message:
        "OTP sent to your email. Please verify to complete registration.",
      email,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// Verify Signup OTP
const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new one.",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.findOneAndDelete({ email });
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const gymOwner = await GymOwner.findOne({ email });
    if (!gymOwner) {
      return res.status(400).json({
        success: false,
        message: "Gym owner not found. Please register first.",
      });
    }

    // Mark as verified
    gymOwner.isVerified = true;
    await gymOwner.save();

    const token = generateToken(gymOwner._id);
    await Otp.findOneAndDelete({ email });

    res.status(200).json({
      success: true,
      message: "Registration verified successfully",
      token,
      user: {
        id: gymOwner._id,
        gymName: gymOwner.gymName,
        email: gymOwner.email,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
};

const loginGymOwner = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`🔐 Login attempt for: ${email}`);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const gymOwner = await GymOwner.findOne({ email });
    if (!gymOwner) {
      console.log("❌ GymOwner not found");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!gymOwner.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, gymOwner.password);
    if (!isPasswordValid) {
      console.log("❌ Invalid password");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("✅ Password verified, sending login OTP...");

    // Clear any existing OTPs
    await Otp.findOneAndDelete({ email });

    const otp = generateOTP();
    const otpDoc = new Otp({
      email,
      otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY),
    });
    await otpDoc.save();

    // SEND EMAIL WITH OTP (NO CONSOLE LOG OF OTP)
    try {
      await sendOTP(email, gymOwner.gymName, otp, "login");
    } catch (emailError) {
      console.error(
        "⚠️ Email sending failed, but OTP saved in database:",
        emailError.message
      );
      // Continue - user will get error when trying to verify, but OTP is stored
      res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Credentials verified! Check your email for OTP.",
      email: gymOwner.email,
      requiresOtp: true,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log(`🔍 Verifying login OTP for: ${email}`);

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) {
      console.log(`❌ No OTP record found for ${email}`);
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please retry login.",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      console.log(`⏰ OTP expired for ${email}`);
      await Otp.findOneAndDelete({ email });
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please retry login.",
      });
    }

    if (otpRecord.otp !== otp) {
      console.log(`❌ OTP mismatch for ${email}`);
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const gymOwner = await GymOwner.findOne({ email });
    if (!gymOwner) {
      return res.status(400).json({
        success: false,
        message: "Gym owner not found.",
      });
    }

    console.log(`✅ Login successful for ${email}`);

    const token = generateToken(gymOwner._id);
    await Otp.findOneAndDelete({ email });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: gymOwner._id,
        gymName: gymOwner.gymName,
        email: gymOwner.email,
      },
    });
  } catch (error) {
    console.error("Login OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login OTP verification",
    });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const gymOwner = await GymOwner.findOne({ email });
    if (!gymOwner) {
      return res.status(400).json({
        success: false,
        message: "Gym owner not found",
      });
    }

    // Clear existing OTP
    await Otp.findOneAndDelete({ email });

    const otp = generateOTP();
    const otpDoc = new Otp({
      email,
      otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY),
    });
    await otpDoc.save();

    // Send new OTP (no console log of OTP value)
    try {
      await sendOTP(email, gymOwner.gymName, otp, "login");
    } catch (emailError) {
      console.error("Email resend failed:", emailError.message);
      res.status(500).json({
        success: false,
        message: "Failed to resend OTP. Please try again.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `New OTP sent to ${email}`,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending OTP",
    });
  }
};

const authController = {
  registerGymOwner,
  verifySignupOTP,
  loginGymOwner,
  verifyLoginOtp,
  resendOTP,
};

module.exports = authController;
