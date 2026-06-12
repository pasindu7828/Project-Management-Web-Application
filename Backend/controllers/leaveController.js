import mongoose from "mongoose";
import LeaveRequest from "../models/LeaveRequest.js";
import {
  validateUserIdFromToken,
  checkUserExists,
  checkLeaveRequestExists,
  isRequester,
  canDeleteLeaveRequest,
  populateLeaveRequestDetails,
  handleControllerError,
  validateLeaveRequest,
  isAdminOrManager,
  canUpdateLeaveRequest,
  calculateWorkingDays,
  checkLeaveOverlap,
  hasLeavePermission
} from "../helpers/leaveRequestHelper.js";
import { sendLeaveStatusEmail } from "../helpers/emailHelper.js";

// LEAVE POLICY (YEARLY)
const LEAVE_POLICY = {
  sick: 10,
  annual: 10,
  casual: 5,
};

// Total leaves allowed per year (sum of all types)
const TOTAL_LEAVES_PER_YEAR = LEAVE_POLICY.sick + LEAVE_POLICY.annual + LEAVE_POLICY.casual; // 25

// Helper to calculate days between dates (including both start and end)
const calculateDays = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// Helper to check both yearly total limit AND individual leave type limits
const checkLeaveLimits = async (userId, leaveType, newStartDate, newEndDate, excludeLeaveId = null) => {
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  // Get all approved leaves for this year
  const query = {
    requestedBy: userId,
    sts: "approved", // Only count approved leaves
    startDate: { $lte: yearEnd },
    endDate: { $gte: yearStart }
  };

  // Exclude current leave if updating
  if (excludeLeaveId) {
    query._id = { $ne: excludeLeaveId };
  }

  const approvedLeaves = await LeaveRequest.find(query);

  // Calculate used leave days by type
  const usedByType = { sick: 0, annual: 0, casual: 0 };
  let totalUsed = 0;

  approvedLeaves.forEach(leave => {
    const overlapStart = leave.startDate < yearStart ? yearStart : leave.startDate;
    const overlapEnd = leave.endDate > yearEnd ? yearEnd : leave.endDate;

    if (overlapStart <= overlapEnd) {
      const days = calculateDays(overlapStart, overlapEnd);
      if (usedByType[leave.leaveType] !== undefined) {
        usedByType[leave.leaveType] += days;
        totalUsed += days;
      }
    }
  });

  // Calculate new request days
  const newLeaveDays = calculateDays(newStartDate, newEndDate);

  // 1. Check individual leave type limit
  if (usedByType[leaveType] + newLeaveDays > LEAVE_POLICY[leaveType]) {
    throw {
      status: 400,
      message: `${leaveType.charAt(0).toUpperCase() + leaveType.slice(1)} leave limit exceeded. You can only take ${LEAVE_POLICY[leaveType]} ${leaveType} leaves per year.`,
    };
  }

  // 2. Check total yearly limit
  if (totalUsed + newLeaveDays > TOTAL_LEAVES_PER_YEAR) {
    throw {
      status: 400,
      message: `Total leave limit exceeded. You can only take ${TOTAL_LEAVES_PER_YEAR} leaves per year across all types.`,
    };
  }

  return { 
    usedByType, 
    totalUsed, 
    newLeaveDays,
    remainingByType: {
      sick: Math.max(0, LEAVE_POLICY.sick - usedByType.sick),
      annual: Math.max(0, LEAVE_POLICY.annual - usedByType.annual),
      casual: Math.max(0, LEAVE_POLICY.casual - usedByType.casual)
    },
    totalRemaining: Math.max(0, TOTAL_LEAVES_PER_YEAR - totalUsed)
  };
};

// Create Leave Request
export const createLeaveRequest = async (req, res) => {
  try {
    validateUserIdFromToken(req.user?.userid);
    await checkUserExists(req.user.userid);

    validateLeaveRequest(req.body);

    // Check for overlapping leaves
    await checkLeaveOverlap(
      req.user.userid,
      req.body.startDate,
      req.body.endDate
    );

    // Check leave limits (both type-specific and total)
    await checkLeaveLimits(
      req.user.userid,
      req.body.leaveType,
      req.body.startDate,
      req.body.endDate
    );

    const leaveRequest = new LeaveRequest({
      ...req.body,
      requestedBy: new mongoose.Types.ObjectId(req.user.userid)
    });

    await leaveRequest.save();
    const populatedLeave = await populateLeaveRequestDetails(leaveRequest._id);

    res.status(201).json({
      success: true,
      message: "Leave request created successfully.",
      data: populatedLeave,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

// Update Leave Request (PUT) - Requester only
export const updateLeaveRequest = async (req, res) => {
  try {
    validateUserIdFromToken(req.user?.userid);
    const { id } = req.params;

    const leaveRequest = await checkLeaveRequestExists(id);

    if (!hasLeavePermission(leaveRequest, req.user, 'update')) {
      throw {
        status: 403,
        message: "You don't have permission to update this leave request.",
      };
    }

    const allowedUpdates = ["leaveType", "reason", "startDate", "endDate"];
    const updates = {};
    
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      throw {
        status: 400,
        message: "No valid fields provided for update.",
      };
    }

    // Create temporary object for validation
    const tempData = { ...leaveRequest.toObject(), ...updates };
    validateLeaveRequest(tempData);

    // Only check leave limits if the leave is approved
    if (leaveRequest.sts === "approved" && (updates.startDate || updates.endDate || updates.leaveType)) {
      await checkLeaveLimits(
        req.user.userid,
        updates.leaveType || leaveRequest.leaveType,
        updates.startDate || leaveRequest.startDate,
        updates.endDate || leaveRequest.endDate,
        id
      );
    }

    // Check for overlapping leaves (excluding current leave)
    if (updates.startDate || updates.endDate) {
      await checkLeaveOverlap(
        req.user.userid,
        updates.startDate || leaveRequest.startDate,
        updates.endDate || leaveRequest.endDate,
        id
      );
    }

    const updatedLeave = await LeaveRequest.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    const populatedLeave = await populateLeaveRequestDetails(updatedLeave._id);

    res.json({
      success: true,
      message: "Leave request updated successfully.",
      data: populatedLeave,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

// Update Leave Status (PATCH) - Manager/Admin only
export const updateLeaveStatus = async (req, res) => {
  try {
    validateUserIdFromToken(req.user?.userid);
    const { id } = req.params;
    const { sts, rejectionReason } = req.body;

    if (!["approved", "rejected", "pending", "cancelled"].includes(sts)) {
      throw {
        status: 400,
        message: "Invalid leave status.",
      };
    }

    const leaveRequest = await checkLeaveRequestExists(id);

    // Determine permission based on status
    let hasPermission = false;
    if (["approved", "rejected"].includes(sts)) {
      hasPermission = hasLeavePermission(leaveRequest, req.user, 'approve');
    } else if (sts === "cancelled") {
      hasPermission = hasLeavePermission(leaveRequest, req.user, 'cancel');
    } else if (sts === "pending") {
      // Only requester can set back to pending
      hasPermission = isRequester(leaveRequest.requestedBy, req.user.userid);
    }

    if (!hasPermission) {
      throw {
        status: 403,
        message: "You don't have permission to perform this action.",
      };
    }

    // Check leave limits BEFORE approving
    if (sts === "approved") {
      await checkLeaveLimits(
        leaveRequest.requestedBy,
        leaveRequest.leaveType,
        leaveRequest.startDate,
        leaveRequest.endDate,
        id
      );
    }

    // Prepare update data
    const updateData = {
      sts,
      approvedBy: ["approved", "rejected"].includes(sts)
        ? new mongoose.Types.ObjectId(req.user.userid)
        : null,
    };

    // Add rejection reason if provided
    if (sts === "rejected" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const updatedLeave = await LeaveRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    const populatedLeave = await populateLeaveRequestDetails(updatedLeave._id);

    // Send email notification
    if (
      populatedLeave.requestedBy &&
      populatedLeave.requestedBy.email &&
      ["approved", "rejected"].includes(sts)
    ) {
      const fullName = `${populatedLeave.requestedBy.FirstName} ${populatedLeave.requestedBy.LastName}`;
      await sendLeaveStatusEmail(
        populatedLeave.requestedBy.email,
        fullName,
        sts,
        rejectionReason
      );
    }

    res.json({
      success: true,
      message: `Leave request ${sts} successfully.`,
      data: populatedLeave,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

// Get all leaves of a user
export const getLeavesByUser = async (req, res) => {
  try {
    validateUserIdFromToken(req.user?.userid);
    const { uid } = req.params;

    await checkUserExists(uid);

    // Check if user is viewing their own leaves or is Admin/Manager
    const isOwnLeaves = req.user.userid === uid;
    if (!isOwnLeaves && !isAdminOrManager(req.user.role)) {
      throw {
        status: 403,
        message: "You can only view your own leave requests.",
      };
    }

    const leaves = await LeaveRequest.find({ requestedBy: uid })
      .sort({ createdAt: -1 })
      .populate({
        path: "requestedBy",
        select: "FirstName LastName email departmentID role",
        populate: { 
          path: "departmentID", 
          select: "name departmentCode location email" 
        }
      })
      .populate("approvedBy", "FirstName LastName email");

    res.json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

// Get single leave request
export const getSingleLeave = async (req, res) => {
  try {
    validateUserIdFromToken(req.user?.userid);
    const { id } = req.params;

    const leave = await checkLeaveRequestExists(id);

    if (!hasLeavePermission(leave, req.user, 'view')) {
      throw {
        status: 403,
        message: "You are not allowed to view this leave request.",
      };
    }

    const populatedLeave = await populateLeaveRequestDetails(leave._id);

    res.json({
      success: true,
      data: populatedLeave,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

// Get all leave requests (Admin / Manager only)
export const getAllLeaves = async (req, res) => {
  try {
    validateUserIdFromToken(req.user?.userid);

    if (!isAdminOrManager(req.user.role)) {
      throw {
        status: 403,
        message: "Access denied. Only Admin or Manager can view all leave requests.",
      };
    }

    const leaves = await LeaveRequest.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "requestedBy",
        select: "FirstName LastName email departmentID role",
        populate: { 
          path: "departmentID", 
          select: "name departmentCode location email" 
        }
      })
      .populate("approvedBy", "FirstName LastName email");

    res.json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

// Get leave balance per year - FIXED VERSION
export const getLeaveBalance = async (req, res) => {
  try {
    validateUserIdFromToken(req.user?.userid);
    const userId = req.user.userid;

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    // Get only APPROVED leaves that overlap with the current year
    const leaves = await LeaveRequest.find({
      requestedBy: userId,
      sts: "approved", // Only count approved leaves
      $or: [
        { 
          startDate: { $lte: yearEnd },
          endDate: { $gte: yearStart }
        }
      ]
    });

    // Calculate used leaves by type (only approved)
    const used = { sick: 0, annual: 0, casual: 0 };
    let totalUsedDays = 0;

    leaves.forEach(leave => {
      // Calculate overlapping days with current year
      const overlapStart = leave.startDate < yearStart ? yearStart : leave.startDate;
      const overlapEnd = leave.endDate > yearEnd ? yearEnd : leave.endDate;
      
      if (overlapStart <= overlapEnd) {
        const days = calculateDays(overlapStart, overlapEnd);
        if (used[leave.leaveType] !== undefined) {
          used[leave.leaveType] += days;
          totalUsedDays += days;
        }
      }
    });

    res.json({
      success: true,
      year: currentYear,
      policy: LEAVE_POLICY,
      used,
      totalUsed: totalUsedDays,
      totalAllowed: TOTAL_LEAVES_PER_YEAR,
      remaining: {
        sick: Math.max(0, LEAVE_POLICY.sick - used.sick),
        annual: Math.max(0, LEAVE_POLICY.annual - used.annual),
        casual: Math.max(0, LEAVE_POLICY.casual - used.casual),
        total: Math.max(0, TOTAL_LEAVES_PER_YEAR - totalUsedDays)
      },
      usage: {
        sick: `${used.sick}/${LEAVE_POLICY.sick}`,
        annual: `${used.annual}/${LEAVE_POLICY.annual}`,
        casual: `${used.casual}/${LEAVE_POLICY.casual}`,
        total: `${totalUsedDays}/${TOTAL_LEAVES_PER_YEAR}`
      },
      limits: {
        individualType: "Annual: 10, Casual: 5, Sick: 10",
        totalYearly: "Maximum 25 days per year across all types"
      }
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

// Get leave status counts for a user (employee + admin/manager)
export const getLeaveStatusCounts = async (req, res) => {
  try {
    validateUserIdFromToken(req.user?.userid);

    let targetUserId;
    let requestedBy = 'self'; // Default to self

    // Route parameter: /status/:employeeId
    if (req.params.employeeId) {
      targetUserId = req.params.employeeId;
      requestedBy = 'admin';
      
      // This route is protected by isManagerOrAdmin middleware,
      // but double-check for safety
      if (!isAdminOrManager(req.user.role)) {
        throw {
          status: 403,
          message: "Only Admin/Manager can view other employee's leave statistics."
        };
      }
    } 
    // No parameter: /status (self-view)
    else {
      targetUserId = req.user.userid;
    }

    // Validate user exists
    await checkUserExists(targetUserId);

    // Decide which statuses to include
    let statusFilter = {};
    let resultTemplate;

    if (targetUserId === req.user.userid) {
      // Employee viewing self → all statuses
      resultTemplate = { 
        pending: 0, 
        approved: 0, 
        rejected: 0, 
        cancelled: 0, 
        total: 0 
      };
    } else if (isAdminOrManager(req.user.role)) {
      // Admin/Manager viewing someone else → only pending + rejected
      statusFilter.sts = { $in: ["pending", "rejected"] };
      resultTemplate = { 
        pending: 0, 
        rejected: 0, 
        total: 0 
      };
    } else {
      // Should not happen due to middleware, but safety check
      throw { 
        status: 403, 
        message: "Unauthorized to view leave statistics." 
      };
    }

    // Aggregate leave counts
    const counts = await LeaveRequest.aggregate([
      {
        $match: {
          requestedBy: new mongoose.Types.ObjectId(targetUserId),
          ...statusFilter
        }
      },
      {
        $group: {
          _id: "$sts",
          count: { $sum: 1 }
        }
      }
    ]);

    // Fill result
    const result = { ...resultTemplate };
    counts.forEach(c => {
      if (result.hasOwnProperty(c._id)) {
        result[c._id] = c.count;
        result.total += c.count;
      }
    });

    // Calculate percentages
    const percentages = {};
    if (result.total > 0) {
      Object.keys(result).forEach(key => {
        if (key !== 'total' && typeof result[key] === 'number') {
          percentages[key] = ((result[key] / result.total) * 100).toFixed(1) + '%';
        }
      });
    }

    res.json({
      success: true,
      data: {
        counts: result,
        percentages: result.total > 0 ? percentages : null
      },
      meta: {
        employeeId: targetUserId,
        requestedBy,
        currentUser: req.user.userid,
        role: req.user.role,
        endpoint: req.params.employeeId ? 'admin-view' : 'self-view'
      },
      message: requestedBy === 'self' 
        ? "Your leave status counts retrieved successfully." 
        : `Leave status counts for employee ${targetUserId} retrieved successfully.`
    });

  } catch (error) {
    handleControllerError(error, res);
  }
};

// Delete Leave Request - Requester only
export const deleteLeaveRequest = async (req, res) => {
  try {
    validateUserIdFromToken(req.user?.userid);
    const { id } = req.params;

    const leaveRequest = await checkLeaveRequestExists(id);

    if (!hasLeavePermission(leaveRequest, req.user, 'delete')) {
      throw {
        status: 403,
        message: "You don't have permission to delete this leave request.",
      };
    }

    canDeleteLeaveRequest(leaveRequest.sts);
    await LeaveRequest.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Leave request deleted successfully.",
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};
