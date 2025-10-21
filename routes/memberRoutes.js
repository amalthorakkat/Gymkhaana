const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
} = require("../controllers/memberController");
const { authenticateGymOwner } = require("../middlewares/authMiddleware");

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Create a new member
router.post(
  "/create-member",
  authenticateGymOwner,
  upload.single("profileImage"),
  createMember
);

// ✅ Get all members for the logged-in gym owner
router.get("/get-members", authenticateGymOwner, getMembers);

// ✅ Get a single member by ID
router.get("/get-member/:id", authenticateGymOwner, getMemberById);

// ✅ Update a member by ID
router.put(
  "/update-member/:id",
  authenticateGymOwner,
  upload.single("profileImage"), // Add multer middleware for profileImage
  updateMember
);

// ✅ Delete a member by ID
router.delete("/delete-member/:id", authenticateGymOwner, deleteMember);

module.exports = router;
