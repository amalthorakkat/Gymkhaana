// const jwt = require("jsonwebtoken");
// const GymOwner = require("../models/GymOwner");

// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// // Middleware to verify JWT token and attach user to req
// const authenticateToken = async (req, res, next) => {
//   try {
//     const authHeader = req.headers["authorization"];
//     const token = authHeader && authHeader.split(" ")[1];

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: "Access token required",
//       });
//     }

//     const decoded = jwt.verify(token, JWT_SECRET);
//     const gymOwner = await GymOwner.findById(decoded.userId).select(
//       "-password"
//     );

//     if (!gymOwner) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid token - user not found",
//       });
//     }

//     req.gymOwner = gymOwner;
//     req.userId = gymOwner._id;
//     next();
//   } catch (error) {
//     console.error("Auth middleware error:", error);
//     return res.status(403).json({
//       success: false,
//       message: "Invalid or expired token",
//     });
//   }
// };

// const authorizeGymOwner = (req, res, next) => {
//   if (!req.gymOwner) {
//     return res.status(401).json({
//       success: false,
//       message: "Please authenticate as gym owner",
//       error: "Please authenticate as admin",
//     });
//   }
//   next();
// };

// const authenticateGymOwnerMiddleware = [authenticateToken, authorizeGymOwner];

// module.exports = {
//   authenticateToken,
//   authorizeGymOwner,
//   authenticateGymOwner: authenticateGymOwnerMiddleware,
// };

const jwt = require("jsonwebtoken");
const GymOwner = require("../models/GymOwner");
const Admin = require("../models/Admin");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token and attach user to req
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    let user;

    if (decoded.role === "admin") {
      user = await Admin.findById(decoded.userId).select("-password");
    } else {
      user = await GymOwner.findById(decoded.userId).select("-password");
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token - user not found",
      });
    }

    req.user = user;
    req.userId = user._id;
    req.role = decoded.role || "gymOwner";
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const authorizeGymOwner = (req, res, next) => {
  if (req.role !== "gymOwner") {
    return res.status(401).json({
      success: false,
      message: "Please authenticate as gym owner",
    });
  }
  req.gymOwner = req.user;
  next();
};

const authorizeAdmin = (req, res, next) => {
  if (req.role !== "admin") {
    return res.status(401).json({
      success: false,
      message: "Please authenticate as admin",
    });
  }
  req.admin = req.user;
  next();
};

const authenticateGymOwner = [authenticateToken, authorizeGymOwner];
const authenticateAdmin = [authenticateToken, authorizeAdmin];

module.exports = {
  authenticateToken,
  authorizeGymOwner,
  authorizeAdmin,
  authenticateGymOwner,
  authenticateAdmin,
};
