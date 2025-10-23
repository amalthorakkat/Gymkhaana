const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Otp = require("../models/Otp");
const { otpTemplate } = require("../utils/templates/otpTemplate");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-key-change-in-production";
const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes

// External transporter for email
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
const sendOTP = async (email, name, otp, purpose = "verification") => {
  try {
    console.log(`📧 Sending ${purpose} OTP to ${email} for ${name}`);
    const mailOptions = {
      from: `"Gymkhaana Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject:
        purpose === "login"
          ? `Gymkhaana Admin Login`
          : `Gymkhaana Admin - OTP Verification`,
      html: otpTemplate(otp, name, purpose),
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
  return jwt.sign({ userId, role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
};

// Register Admin
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
    });
    await admin.save();

    const otp = generateOTP();
    const otpDoc = new Otp({
      email,
      otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY),
    });
    await otpDoc.save();

    await sendOTP(email, name, otp, "verification");

    res.status(201).json({
      success: true,
      message:
        "OTP sent to your email. Please verify to complete registration.",
      email,
    });
  } catch (error) {
    console.error("Admin registration error:", error);
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

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not found. Please register first.",
      });
    }

    admin.isVerified = true;
    await admin.save();

    const token = generateToken(admin._id);
    await Otp.findOneAndDelete({ email });

    res.status(200).json({
      success: true,
      message: "Registration verified successfully",
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
};

// Login Admin
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`🔐 Admin login attempt for: ${email}`);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log("❌ Admin not found");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!admin.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      console.log("❌ Invalid password");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("✅ Password verified, sending login OTP...");

    await Otp.findOneAndDelete({ email });

    const otp = generateOTP();
    const otpDoc = new Otp({
      email,
      otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY),
    });
    await otpDoc.save();

    try {
      await sendOTP(email, admin.name, otp, "login");
    } catch (emailError) {
      console.error(
        "⚠️ Email sending failed, but OTP saved in database:",
        emailError.message
      );
      res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Credentials verified! Check your email for OTP.",
      email: admin.email,
      requiresOtp: true,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Verify Login OTP
const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log(`🔍 Verifying admin login OTP for: ${email}`);

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

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not found.",
      });
    }

    console.log(`✅ Admin login successful for ${email}`);

    const token = generateToken(admin._id);
    await Otp.findOneAndDelete({ email });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin login OTP verification error:", error);
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

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not found",
      });
    }

    await Otp.findOneAndDelete({ email });

    const otp = generateOTP();
    const otpDoc = new Otp({
      email,
      otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY),
    });
    await otpDoc.save();

    try {
      await sendOTP(email, admin.name, otp, "login");
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
    console.error("Admin resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending OTP",
    });
  }
};

module.exports = {
  registerAdmin,
  verifySignupOTP,
  loginAdmin,
  verifyLoginOtp,
  resendOTP,
};
