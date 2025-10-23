const mongoose = require("mongoose");

const gymOwnerSchema = new mongoose.Schema(
  {
    gymName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const GymOwner = mongoose.model("GymOwner", gymOwnerSchema);

module.exports = GymOwner;

// const mongoose = require("mongoose");

// const gymOwnerSchema = new mongoose.Schema(
//   {
//     gymName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     address: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     contactNumber: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//     activeSubscription: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "GymOwnerSubscription",
//       default: null,
//     },
//   },
//   { timestamps: true }
// );

// const GymOwner = mongoose.model("GymOwner", gymOwnerSchema);

// module.exports = GymOwner;
