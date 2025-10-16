// controllers/planController.js
const Plan = require("../models/Plan");

const createPlan = async (req, res) => {
  try {
    const { name, type, duration, price } = req.body;
    const gymOwnerId = req.gymOwner.id;

    // Validation
    if (!name || !type || !duration || !price) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid positive number",
      });
    }

    // Check if plan name already exists for this gym owner
    const existingPlan = await Plan.findOne({
      name: name.toUpperCase(),
      gymOwnerId,
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: "Plan name already exists",
      });
    }

    const plan = new Plan({
      name: name.toUpperCase(),
      type,
      duration,
      price: parseFloat(price),
      gymOwnerId,
    });

    await plan.save();

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Create plan error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating plan",
    });
  }
};

const getPlans = async (req, res) => {
  try {
    const gymOwnerId = req.gymOwner.id;

    const plans = await Plan.find({ gymOwnerId })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "Plans fetched successfully",
      plans,
      count: plans.length,
    });
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching plans",
    });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, duration, price } = req.body;
    const gymOwnerId = req.gymOwner.id;

    // Find plan
    const plan = await Plan.findOne({ _id: id, gymOwnerId });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // Update fields if provided
    if (name) plan.name = name.toUpperCase();
    if (type) plan.type = type;
    if (duration) plan.duration = duration;
    if (price) {
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a valid positive number",
        });
      }
      plan.price = parseFloat(price);
    }

    // Check for duplicate name (excluding current plan)
    if (name) {
      const duplicatePlan = await Plan.findOne({
        name: name.toUpperCase(),
        gymOwnerId,
        _id: { $ne: id },
      });
      if (duplicatePlan) {
        return res.status(400).json({
          success: false,
          message: "Plan name already exists",
        });
      }
    }

    await plan.save();

    res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      plan,
    });
  } catch (error) {
    console.error("Update plan error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating plan",
    });
  }
};

const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const gymOwnerId = req.gymOwner.id;

    const plan = await Plan.findOneAndDelete({ _id: id, gymOwnerId });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
      deletedPlan: plan,
    });
  } catch (error) {
    console.error("Delete plan error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting plan",
    });
  }
};

module.exports = {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
};
