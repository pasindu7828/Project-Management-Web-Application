import express from "express";
import {requiredSignIn, isManagerOrAdmin} from "../middlewares/AuthMiddleware.js";
import {
  createLeaveRequest,
  deleteLeaveRequest,
  updateLeaveRequest,
  updateLeaveStatus,
  getLeavesByUser,
  getSingleLeave,
  getAllLeaves,
  getLeaveBalance,
  getLeaveStatusCounts
} from "../controllers/leaveController.js";

const router = express.Router();

//All routes are protected with JWT
router.use(requiredSignIn);

router.use(express.json());

// POST /api/v1/leave-request/addLeave - Create new leave request
router.post("/addLeave", createLeaveRequest);

// Update leave details (requester only)
router.put("/updateLeave/:id", updateLeaveRequest);

// Approve / Reject / Pending (Manager/Admin only)
router.patch(
  "/updateLeaveStatus/:id",
  isManagerOrAdmin,
  updateLeaveStatus
);

// Employee routes
router.get("/getLeave/:uid", getLeavesByUser);
router.get("/getUserLeave/:id", getSingleLeave);

// Manager / Admin routes
router.get("/getAllLeaves", isManagerOrAdmin, getAllLeaves);

//Get leave balance for logged-in user**
router.get("/leave-balance", getLeaveBalance);

// Get logged-in user's leave status counts
router.get("/status", getLeaveStatusCounts);

// Get specific employee's leave status counts (Manager/Admin only)
router.get("/status/:employeeId", isManagerOrAdmin, getLeaveStatusCounts);

// DELETE /api/v1/leave-request/deleteLeave/:id - Delete leave request
router.delete("/deleteLeave/:id", deleteLeaveRequest);

export default router;
