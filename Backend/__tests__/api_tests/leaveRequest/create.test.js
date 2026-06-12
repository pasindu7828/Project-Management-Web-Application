// Backend/__tests__/api_tests/leaveRequest/create.test.js
import { describe, expect, test, beforeEach } from "@jest/globals";
import request from "supertest";
import { TestUtils } from "../../testUtils.js";
import app from "../../../app.js";

describe("POST /api/v1/leave-request/addLeave - Create Leave Request", () => {
  let authToken;
  let testUser;

  // Create user and get token once for all tests
  beforeEach(async () => {
    try {
      const result = await TestUtils.createUserAndGetToken();
      testUser = result.user;
      authToken = result.token;
    } catch (error) {
      console.error("Failed to create test user:", error);
      throw error;
    }
  });

  // Helper function to get future dates
  const getFutureDate = (daysFromNow = 7) => {
    return TestUtils.getFutureDate(daysFromNow);
  };

  // Test 1: Successful creation of leave request
  test("Should create leave request successfully", async () => {
    const validLeaveRequest = {
      leaveType: "Annual Leave",
      reason: "I need a vacation for personal reasons and family time.",
      startDate: getFutureDate(7),
      endDate: getFutureDate(14),
    };

    const response = await request(app)
      .post("/api/v1/leave-request/addLeave")
      .set("Authorization", authToken)
      .send(validLeaveRequest);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Leave request created successfully.");
    expect(response.body.data).toHaveProperty("_id");
  });

  // Test 2: Missing required field (leaveType)
  test("Should fail when leaveType is missing", async () => {
    const invalidRequest = {
      reason: "I need a vacation for personal reasons and family time.",
      startDate: getFutureDate(7),
      endDate: getFutureDate(14),
    };

    const response = await request(app)
      .post("/api/v1/leave-request/addLeave")
      .set("Authorization", authToken)
      .send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Leave request validation failed");
    expect(response.body.errors).toContain("leaveType is required");
  });

  // Test 3: Short reason
  test("Should fail when reason is too short", async () => {
    const invalidRequest = {
      leaveType: "Annual Leave",
      reason: "Short",
      startDate: getFutureDate(7),
      endDate: getFutureDate(14),
    };

    const response = await request(app)
      .post("/api/v1/leave-request/addLeave")
      .set("Authorization", authToken)
      .send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Leave request validation failed");
    expect(response.body.errors).toContain(
      "Reason must be at least 10 characters"
    );
  });

  // Test 4: Empty reason
  test("Should fail when reason is empty", async () => {
    const invalidRequest = {
      leaveType: "Annual Leave",
      reason: "",
      startDate: getFutureDate(7),
      endDate: getFutureDate(14),
    };

    const response = await request(app)
      .post("/api/v1/leave-request/addLeave")
      .set("Authorization", authToken)
      .send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Leave request validation failed");
    expect(response.body.errors).toContain("Reason is required");
  });

  // Test 5: Past start date
  test("Should fail when start date is in the past", async () => {
    const invalidRequest = {
      leaveType: "Annual Leave",
      reason: "I need a vacation for personal reasons and family time.",
      startDate: "2023-01-01",
      endDate: getFutureDate(14),
    };

    const response = await request(app)
      .post("/api/v1/leave-request/addLeave")
      .set("Authorization", authToken)
      .send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Leave request validation failed");
    expect(response.body.errors).toContain("Start date cannot be in the past");
  });

  // Test 6: End date before start date
  test("Should fail when end date is before start date", async () => {
    const invalidRequest = {
      leaveType: "Annual Leave",
      reason: "I need a vacation for personal reasons and family time.",
      startDate: getFutureDate(14),
      endDate: getFutureDate(7),
    };

    const response = await request(app)
      .post("/api/v1/leave-request/addLeave")
      .set("Authorization", authToken)
      .send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Leave request validation failed");
    expect(response.body.errors).toContain("End date must be after start date");
  });

  // Test 7: Missing start date
  test("Should fail when start date is missing", async () => {
    const invalidRequest = {
      leaveType: "Annual Leave",
      reason: "I need a vacation for personal reasons and family time.",
      endDate: getFutureDate(14),
    };

    const response = await request(app)
      .post("/api/v1/leave-request/addLeave")
      .set("Authorization", authToken)
      .send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Leave request validation failed");
    expect(response.body.errors).toContain("startDate is required");
  });

  // Test 8: Missing end date
  test("Should fail when end date is missing", async () => {
    const invalidRequest = {
      leaveType: "Annual Leave",
      reason: "I need a vacation for personal reasons and family time.",
      startDate: getFutureDate(7),
    };

    const response = await request(app)
      .post("/api/v1/leave-request/addLeave")
      .set("Authorization", authToken)
      .send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Leave request validation failed");
    expect(response.body.errors).toContain("endDate is required");
  });

  // Test 9: No authentication token
  test("Should fail without authentication token", async () => {
    const validLeaveRequest = {
      leaveType: "Annual Leave",
      reason: "I need a vacation for personal reasons and family time.",
      startDate: getFutureDate(7),
      endDate: getFutureDate(14),
    };

    const response = await request(app)
      .post("/api/v1/leave-request/addLeave")
      .send(validLeaveRequest);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Access denied. No token provided.");
  });

  // Test 10: Invalid authentication token
  test("Should fail with invalid authentication token", async () => {
    const validLeaveRequest = {
      leaveType: "Annual Leave",
      reason: "I need a vacation for personal reasons and family time.",
      startDate: getFutureDate(7),
      endDate: getFutureDate(14),
    };

    const response = await request(app)
      .post("/api/v1/leave-request/addLeave")
      .set("Authorization", "invalid-token")
      .send(validLeaveRequest);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid or expired token");
  });
});
