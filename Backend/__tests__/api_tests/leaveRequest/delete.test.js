// Backend/__tests__/api_tests/leaveRequest/delete.test.js
import { describe, expect, test, beforeEach } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import LeaveRequest from "../../../models/LeaveRequest.js";
import { TestUtils } from "../../testUtils.js";
import app from "../../../app.js";

describe("DELETE /api/v1/leave-request/deleteLeave/:id - Delete Leave Request", () => {
  // Helper to create leave request
  const createLeaveRequest = async (authToken, leaveData = {}) => {
    const defaultData = {
      leaveType: "Sick Leave",
      reason: "I am not feeling well and need to see a doctor.",
      startDate: TestUtils.getFutureDate(7),
      endDate: TestUtils.getFutureDate(8),
      ...leaveData,
    };

    const response = await request(app)
      .post("/api/v1/leave-request/addLeave")
      .set("Authorization", authToken)
      .send(defaultData);

    return response.body.data._id;
  };

  // Test 1: Successful deletion
  test("Should delete leave request successfully", async () => {
    const { user, token } = await TestUtils.createUserAndGetToken();
    const leaveRequestId = await createLeaveRequest(token);

    const response = await request(app)
      .delete(`/api/v1/leave-request/deleteLeave/${leaveRequestId}`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Leave request deleted successfully.");
  });

  // Test 2: Invalid ID format
  test("Should fail with invalid ID format", async () => {
    const { token } = await TestUtils.createUserAndGetToken();

    const response = await request(app)
      .delete("/api/v1/leave-request/deleteLeave/invalid-id")
      .set("Authorization", token);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid ID format.");
  });

  // Test 3: Non-existent leave request
  test("Should fail with non-existent leave request", async () => {
    const { token } = await TestUtils.createUserAndGetToken();

    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .delete(`/api/v1/leave-request/deleteLeave/${nonExistentId}`)
      .set("Authorization", token);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Leave request not found.");
  });

  // Test 4: Cannot delete approved leave request
  test("Should not delete approved leave request", async () => {
    const { user, token } = await TestUtils.createUserAndGetToken();

    // Create and approve a leave request directly in DB
    const approvedLeave = new LeaveRequest({
      leaveType: "Annual Leave",
      reason: "Vacation for family reunion",
      startDate: TestUtils.getFutureDate(7),
      endDate: TestUtils.getFutureDate(14),
      sts: "approved",
      requestedBy: user._id,
    });
    await approvedLeave.save();

    const response = await request(app)
      .delete(`/api/v1/leave-request/deleteLeave/${approvedLeave._id}`)
      .set("Authorization", token);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Cannot delete leave request that has been approved or rejected."
    );
  });

  // Test 5: Cannot delete rejected leave request
  test("Should not delete rejected leave request", async () => {
    const { user, token } = await TestUtils.createUserAndGetToken();

    // Create and reject a leave request directly in DB
    const rejectedLeave = new LeaveRequest({
      leaveType: "Annual Leave",
      reason: "Vacation for family reunion",
      startDate: TestUtils.getFutureDate(7),
      endDate: TestUtils.getFutureDate(14),
      sts: "rejected",
      requestedBy: user._id,
    });
    await rejectedLeave.save();

    const response = await request(app)
      .delete(`/api/v1/leave-request/deleteLeave/${rejectedLeave._id}`)
      .set("Authorization", token);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Cannot delete leave request that has been approved or rejected."
    );
  });

  // Test 6: Different user cannot delete
  test("Should fail when different user tries to delete", async () => {
    // Create first user and leave request
    const user1 = await TestUtils.createUserAndGetToken();
    const leaveRequestId = await createLeaveRequest(user1.token);

    // Create second user
    const user2 = await TestUtils.createUserAndGetToken();

    // Try to delete with other user's token
    const response = await request(app)
      .delete(`/api/v1/leave-request/deleteLeave/${leaveRequestId}`)
      .set("Authorization", user2.token);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "You don't have permission to delete this leave request."
    );

    // Verify original user can still delete it
    const originalUserResponse = await request(app)
      .delete(`/api/v1/leave-request/deleteLeave/${leaveRequestId}`)
      .set("Authorization", user1.token);

    expect(originalUserResponse.status).toBe(200);
    expect(originalUserResponse.body.success).toBe(true);
    expect(originalUserResponse.body.message).toBe(
      "Leave request deleted successfully."
    );
  });

  // Test 7: No authentication token
  test("Should fail without authentication token", async () => {
    const { user, token } = await TestUtils.createUserAndGetToken();
    const leaveRequestId = await createLeaveRequest(token);

    const response = await request(app)
      .delete(`/api/v1/leave-request/deleteLeave/${leaveRequestId}`)
      .send();

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Access denied. No token provided.");
  });

  // Test 8: Invalid authentication token
  test("Should fail with invalid authentication token", async () => {
    const { user, token } = await TestUtils.createUserAndGetToken();
    const leaveRequestId = await createLeaveRequest(token);

    const response = await request(app)
      .delete(`/api/v1/leave-request/deleteLeave/${leaveRequestId}`)
      .set("Authorization", "invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid or expired token");
  });

  // Test 9: Can delete pending leave request
  test("Should allow deletion of pending leave request", async () => {
    const { user, token } = await TestUtils.createUserAndGetToken();

    // Create a pending leave request directly in DB
    const pendingLeave = new LeaveRequest({
      leaveType: "Annual Leave",
      reason: "Vacation for family reunion",
      startDate: TestUtils.getFutureDate(7),
      endDate: TestUtils.getFutureDate(14),
      sts: "pending", // Explicitly set as pending
      requestedBy: user._id,
    });
    await pendingLeave.save();

    const response = await request(app)
      .delete(`/api/v1/leave-request/deleteLeave/${pendingLeave._id}`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Leave request deleted successfully.");
  });

  // Test 10: Cannot delete cancelled leave request
  test("Should not delete cancelled leave request", async () => {
    const { user, token } = await TestUtils.createUserAndGetToken();

    // Create and cancel a leave request directly in DB
    const cancelledLeave = new LeaveRequest({
      leaveType: "Annual Leave",
      reason: "Vacation for family reunion",
      startDate: TestUtils.getFutureDate(7),
      endDate: TestUtils.getFutureDate(14),
      sts: "cancelled",
      requestedBy: user._id,
    });
    await cancelledLeave.save();

    const response = await request(app)
      .delete(`/api/v1/leave-request/deleteLeave/${cancelledLeave._id}`)
      .set("Authorization", token);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Cannot delete leave request that has been approved or rejected."
    );
  });
});
