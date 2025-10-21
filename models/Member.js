// models/Member.js
const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Female",
    },
    dateOfBirth: {
      type: Date,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String, // URL or file path
      default: null, // Not required
    },
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan", // Connected to the Plan model
      required: true,
    },
    gymOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GymOwner",
      required: true,
    },
  },
  { timestamps: true }
);

const Member = mongoose.model("Member", memberSchema);

module.exports = Member;
