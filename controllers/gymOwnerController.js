const mongoose = require("mongoose");
const GymOwner = require("../models/GymOwner");

// 🟢 Get All Gym Owners (Admin Only)
const getGymOwners = async (req, res) => {
  try {
    const gymOwners = await GymOwner.find()
      .sort({ createdAt: -1 })
      .select("-password -__v");

    res.status(200).json({
      success: true,
      message: "Gym owners fetched successfully",
      gymOwners,
      count: gymOwners.length,
    });
  } catch (error) {
    console.error("Get gym owners error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching gym owners",
    });
  }
};

// 🟡 Get Gym Owner by ID (Admin Only)
const getGymOwnerById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gym owner ID format",
      });
    }

    const gymOwner = await GymOwner.findById(id).select("-password -__v");
    if (!gymOwner) {
      return res.status(404).json({
        success: false,
        message: "Gym owner not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Gym owner fetched successfully",
      gymOwner,
    });
  } catch (error) {
    console.error("Get gym owner by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching gym owner",
    });
  }
};

module.exports = {
  getGymOwners,
  getGymOwnerById,
};
