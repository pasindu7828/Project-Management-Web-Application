// leaveRequestHelper.js

import LeaveRequest from "../models/LeaveRequest.js";
import Employee from "../models/EmployeeModel.js";

// Authentication and authorization helpers
export const validateUserIdFromToken = (userId) => {
  if (!userId) {
    throw {
      status: 401,
      message: "Authentication required. User ID not found in token.",
    };
  }
};

export const checkUserExists = async (userId) => {
  const userExists = await Employee.findById(userId);
  if (!userExists) {
    throw {
      status: 404,
      message: "User not found.",
    };
  }
  return userExists;
};

// Leave request validation helpers
export const checkLeaveRequestExists = async (leaveRequestId) => {
  const leaveRequest = await LeaveRequest.findById(leaveRequestId);
  if (!leaveRequest) {
    throw {
      status: 404,
      message: "Leave request not found.",
    };
  }
  return leaveRequest;
};

// ROLE-BASED FUNCTIONS (Matching your middleware)
export const isRequester = (leaveRequestUserId, currentUserId) => {
  if (!leaveRequestUserId || !currentUserId) return false;
  return leaveRequestUserId.toString() === currentUserId.toString();
};

export const isAdmin = (userRole) => {
  return userRole === 3;
};

export const isManager = (userRole) => {
  return userRole === 2;
};

export const isEmployee = (userRole) => {
  return userRole === 1;
};

export const isAdminOrManager = (userRole) => {
  return userRole === 2 || userRole === 3;
};

// Unified permission checker
export const hasLeavePermission = (leaveRequest, currentUser, action) => {
  const isOwner = isRequester(leaveRequest.requestedBy, currentUser.userid);
  const userRole = currentUser.role;
  
  switch (action) {
    case 'view':
      // Allow viewing if owner OR admin/manager OR status is not sensitive
      return isOwner || isAdminOrManager(userRole) || leaveRequest.sts === 'approved';
    
    case 'update':
      return isOwner && leaveRequest.sts === 'pending';
    
    case 'delete':
      return isOwner && leaveRequest.sts === 'pending';
    
    case 'approve':
      return isAdminOrManager(userRole) && leaveRequest.sts === 'pending';
    
    case 'reject':
      return isAdminOrManager(userRole) && leaveRequest.sts === 'pending';
    
    case 'cancel':
      return isOwner && leaveRequest.sts === 'pending';
    
    default:
      return false;
  }
};

// Leave request status validation
export const canDeleteLeaveRequest = (status) => {
  const allowedStatuses = ["pending", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    throw {
      status: 400,
      message: "Cannot delete leave request that has been approved or rejected.",
    };
  }
  return true;
};

export const canUpdateLeaveRequest = (status) => {
  const allowedStatuses = ["pending"];
  if (!allowedStatuses.includes(status)) {
    throw {
      status: 400,
      message: "Only pending leave requests can be updated.",
    };
  }
  return true;
};

// Population helper
export const populateLeaveRequestDetails = async (leaveRequestId) => {
  return await LeaveRequest.findById(leaveRequestId)
    .populate({
      path: "requestedBy",
      select: "FirstName LastName email departmentID role",
      populate: { 
        path: "departmentID", 
        select: "name departmentCode location email" 
      }
    })
    .populate("approvedBy", "FirstName LastName email");
};

// Error handler
export const handleControllerError = (error, res) => {
  console.error("Controller error:", error);

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format.",
    });
  }

  // Use custom thrown errors or generic
  const status = error.status || 500;
  const message = error.message || "Internal server error.";

  res.status(status).json({
    success: false,
    message,
    errors: error.errors || undefined,
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};

// Validation helper for leave request
export const validateLeaveRequest = (leaveData) => {
  const { leaveType, reason, startDate, endDate } = leaveData;
  const errors = [];

  // Validate required fields
  if (!leaveType) {
    errors.push("leaveType is required");
  } else if (!["sick", "annual", "casual"].includes(leaveType)) {
    errors.push("leaveType must be one of: sick, annual, casual");
  }
  
  if (!reason || reason.trim().length === 0) {
    errors.push("Reason is required");
  } else if (reason.length < 10) {
    errors.push("Reason must be at least 10 characters");
  } else if (reason.length > 500) {
    errors.push("Reason must not exceed 500 characters");
  }
  
  if (!startDate) errors.push("startDate is required");
  if (!endDate) errors.push("endDate is required");

  // Validate date logic if both dates exist
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check date validity
    if (isNaN(start.getTime())) errors.push("Invalid start date format");
    if (isNaN(end.getTime())) errors.push("Invalid end date format");

    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      // Check if start date is in the past
      if (start < today) {
        errors.push("Start date cannot be in the past");
      }

      // Check if end date is after start date
      if (start > end) {
        errors.push("End date must be after start date");
      }

      // Optional: Check maximum leave duration
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        errors.push("Leave duration cannot exceed 30 days");
      }
    }
  }

  // Return errors if any exist
  if (errors.length > 0) {
    throw {
      status: 400,
      message: "Leave request validation failed",
      errors,
    };
  }

  return true;
};

// Additional helper functions
export const calculateWorkingDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let days = 0;
  
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    // Count only weekdays (Monday to Friday)
    if (day !== 0 && day !== 6) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
};

export const checkLeaveOverlap = async (userId, startDate, endDate, excludeLeaveId = null) => {
  const query = {
    requestedBy: userId,
    sts: { $in: ["pending", "approved"] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  };

  if (excludeLeaveId) {
    query._id = { $ne: excludeLeaveId };
  }

  const overlappingLeaves = await LeaveRequest.find(query);
  
  if (overlappingLeaves.length > 0) {
    throw {
      status: 400,
      message: "Leave request overlaps with existing approved or pending leave.",
    };
  }

  return false;
};