// Backend/__tests__/testUtils.js
import request from "supertest";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import app from "../app.js";

// Shared helper functions
export const TestUtils = {
  // Create user directly in DB with hashed password
  createTestUser: async (userData = {}) => {
    const timestamp = Date.now();
    const defaultData = {
      name: "Test User",
      role: userData.role || 1, // Default to employee role
      email: `test${timestamp}@example.com`,
      password: "password123",
      ...userData,
    };

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    defaultData.password = await bcrypt.hash(defaultData.password, salt);

    const user = new User(defaultData);
    await user.save();
    return user;
  },

  // Get auth token via login - Your auth expects token WITHOUT Bearer prefix
  getAuthToken: async (email, password = "password123") => {
    const loginRes = await request(app)
      .post("/api/v1/userAuth/userLogin")
      .send({ email, password });

    if (loginRes.status !== 200) {
      console.error("Login failed:", {
        status: loginRes.status,
        body: loginRes.body,
        email: email,
      });
      throw new Error(
        `Login failed with status ${loginRes.status}: ${JSON.stringify(
          loginRes.body
        )}`
      );
    }

    // Try different possible token locations
    const token =
      loginRes.body.token ||
      loginRes.body.data?.token ||
      loginRes.body.accessToken;

    if (!token) {
     //console.error("No token found in response:", loginRes.body);
      throw new Error("No token found in login response");
    }

    return token;
  },

  // Create user and get token in one call
  createUserAndGetToken: async (userData = {}) => {
    const user = await TestUtils.createTestUser(userData);
    const token = await TestUtils.getAuthToken(
      user.email,
      userData.password || "password123"
    );
    return { user, token };
  },

  // Get future date
  getFutureDate: (daysFromNow = 7) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split("T")[0];
  },

  // Add debug function to check login endpoint
  debugLogin: async (email, password = "password123") => {
    console.log("Attempting login with:", { email, password });
    const response = await request(app)
      .post("/api/v1/userAuth/userLogin")
      .send({ email, password });

    console.log("Login response:", {
      status: response.status,
      body: response.body,
    });

    return response;
  },
};
