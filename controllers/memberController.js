const mongoose = require("mongoose");
const Member = require("../models/Member");
const Plan = require("../models/Plan");
const cloudinary = require("../config/cloudinary");
const GymOwner = require("../models/GymOwner");

// 🟢 Create Member
const createMember = async (req, res) => {
  try {
    const {
      fullName,
      age,
      gender,
      dateOfBirth,
      phoneNumber,
      email,
      address,
      membership,
    } = req.body;
    const gymOwnerId = req.gymOwner.id;

    // Validation
    if (!fullName || !age || !gender || !phoneNumber || !email || !membership) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Validate membership (plan)
    const plan = await Plan.findOne({ _id: membership, gymOwnerId });
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan or plan does not belong to this gym owner",
      });
    }

    // Check for duplicate email or phone
    const existingMember = await Member.findOne({ email, gymOwnerId });
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "Member with this email already exists",
      });
    }

    let profileImageUrl = null;
    if (req.file) {
      const base64Data = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(base64Data, {
        folder: "gymkhaana_members_profile",
        resource_type: "image",
      });
      profileImageUrl = uploadResponse.secure_url;
    }

    const member = new Member({
      fullName,
      age,
      gender,
      dateOfBirth,
      phoneNumber,
      email,
      address,
      membership,
      gymOwnerId,
      profileImage: profileImageUrl,
    });

    await member.save();

    res.status(201).json({
      success: true,
      message: "Member created successfully",
      member,
    });
  } catch (error) {
    console.error("Create member error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating member",
    });
  }
};

// 🟡 Get All Members (for a specific gym owner)
const getMembers = async (req, res) => {
  try {
    const gymOwnerId = req.gymOwner.id;

    const members = await Member.find({ gymOwnerId })
      .populate("membership")
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "Members fetched successfully",
      members,
      count: members.length,
    });
  } catch (error) {
    console.error("Get members error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching members",
    });
  }
};

// 🟣 Get Member By ID
const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const gymOwnerId = req.gymOwner.id;

    const member = await Member.findOne({ _id: id, gymOwnerId }).populate(
      "membership"
    );
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Member fetched successfully",
      member,
    });
  } catch (error) {
    console.error("Get member error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching member",
    });
  }
};

// 🟠 Update Member
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      age,
      gender,
      dateOfBirth,
      phoneNumber,
      email,
      address,
      membership,
    } = req.body;
    const gymOwnerId = req.gymOwner.id;

    const member = await Member.findOne({ _id: id, gymOwnerId });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // Validate membership if updated
    if (membership) {
      const plan = await Plan.findOne({ _id: membership, gymOwnerId });
      if (!plan) {
        return res.status(400).json({
          success: false,
          message: "Invalid plan or plan does not belong to this gym owner",
        });
      }
      member.membership = membership;
    }

    // Update fields if provided
    if (fullName) member.fullName = fullName;
    if (age) member.age = age;
    if (gender) member.gender = gender;
    if (dateOfBirth) member.dateOfBirth = dateOfBirth;
    if (phoneNumber) member.phoneNumber = phoneNumber;
    if (email) {
      // Check for duplicate email (excluding current member)
      const existingMember = await Member.findOne({
        email,
        gymOwnerId,
        _id: { $ne: id },
      });
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: "Member with this email already exists",
        });
      }
      member.email = email;
    }
    if (address) member.address = address;

    // Handle profile image update
    if (req.file) {
      const base64Data = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(base64Data, {
        folder: "gymkhaana_members_profile",
        resource_type: "image",
      });
      member.profileImage = uploadResponse.secure_url;
    }

    await member.save();

    // Populate membership for response
    await member.populate("membership");

    res.status(200).json({
      success: true,
      message: "Member updated successfully",
      member,
    });
  } catch (error) {
    console.error("Update member error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating member",
    });
  }
};

// 🔴 Delete Member
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const gymOwnerId = req.gymOwner.id;

    const member = await Member.findOneAndDelete({ _id: id, gymOwnerId });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Member deleted successfully",
      deletedMember: member,
    });
  } catch (error) {
    console.error("Delete member error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting member",
    });
  }
};

// 🔵 Get total members count for a gym owner
const getTotalMembersCount = async (req, res) => {
  try {
    const gymOwnerId = req.gymOwner.id;

    const totalMembers = await Member.countDocuments({ gymOwnerId });

    res.status(200).json({
      success: true,
      message: "Total members count fetched successfully",
      totalMembers,
    });
  } catch (error) {
    console.error("Get total members count error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching total members count",
    });
  }
};

// 🟢 Get All Members for a Specific Gym Owner (Admin Only)
const getMembersByGymOwner = async (req, res) => {
  try {
    const { gymOwnerId } = req.params;

    // Validate ObjectId
    if (!mongoose.isValidObjectId(gymOwnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gym owner ID format",
      });
    }

    // Validate gym owner exists
    const gymOwner = await GymOwner.findById(gymOwnerId);
    if (!gymOwner) {
      return res.status(404).json({
        success: false,
        message: "Gym owner not found",
      });
    }

    const members = await Member.find({ gymOwnerId })
      .populate("membership")
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      message: `Members for gym owner ${gymOwner.gymName} fetched successfully`,
      gymOwner: {
        id: gymOwner._id,
        gymName: gymOwner.gymName,
        email: gymOwner.email,
      },
      members,
      count: members.length,
    });
  } catch (error) {
    console.error("Get members by gym owner error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching members for gym owner",
    });
  }
};

module.exports = {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
  getTotalMembersCount,
  getMembersByGymOwner,
};
