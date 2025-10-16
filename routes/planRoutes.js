// routes/planRoutes.js
const express = require("express");
const router = express.Router();
const {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
} = require("../controllers/planController");
const { authenticateGymOwner } = require("../middlewares/authMiddleware");

// Create plan - POST /api/plans/create-plan
router.post("/create-plan", authenticateGymOwner, createPlan);

// Get all plans for gym owner - GET /api/plans/get-plans
router.get("/get-plans", authenticateGymOwner, getPlans);

// Update plan - PUT /api/plans/update-plan/:id
router.put("/update-plan/:id", authenticateGymOwner, updatePlan);

// Delete plan - DELETE /api/plans/delete-plan/:id
router.delete("/delete-plan/:id", authenticateGymOwner, deletePlan);

module.exports = router;
