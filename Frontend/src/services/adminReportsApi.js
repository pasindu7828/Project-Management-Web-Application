import axios from "axios";

// Create Axios instance
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}${
    import.meta.env.VITE_API_VERSION
  }`,
  withCredentials: true,
});

const API_URL = `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_VERSION}`;

// =====================
// Attendance
// =====================
export const getAttendance = () =>
  api.get(`${API_URL}/attendance/getAttendent`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

export const getAttendanceReport = () =>
  api.get(`${API_URL}/attendance/attendanceReport`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

// =====================
// Leaves
// =====================
export const getAllLeaves = () =>
  api.get(`${API_URL}/leave-request/getAllLeaves`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

// =====================
// Tasks
// =====================
export const getAllTasks = () =>
  api.get(`${API_URL}/task/getAllTasks`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

export const getTaskReport = () =>
  api.get(`${API_URL}/task/taskReport`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

// =====================
// Projects
// =====================
export const getAllProjects = () =>
  api.get(`${API_URL}/projects/getAllProjects`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

export const getProjectReport = () =>
  api.get(`${API_URL}/projects/projectReport`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

// =====================
// Users
// =====================
export const getAllUsers = () =>
  api.get(`${API_URL}/userAuth/getAllUsers`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

// ---------------------
// Get single user attendance (for user report)
// ---------------------
export const getSingleUserAttendance = (userId) =>
  api.get(`${API_URL}/attendance/get-single-user-attendance/${userId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

// ---------------------
// Get leaves by user (for user report)
// ---------------------
export const getLeavesByUser = (userId) =>
  api.get(`${API_URL}/leave-request/getLeave/${userId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

// ---------------------
// NGet all tasks for a user (for user report)
// ---------------------
export const getAllUserTasks = () =>
  api.get(`${API_URL}/task/getAllUserTasks`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

// ---------------------
// Get single user (optional for profile or reports)
// ---------------------
export const getSingleUser = (userId) =>
  api.get(`${API_URL}/userAuth/getUser/${userId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

export const getSingleEmployee = () =>
  api.get(`${API_URL}/employee/getSingleEmployee`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

export const getAllEmployee = () =>
  api.get(`${API_URL}/employee/getAllEmployee`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
