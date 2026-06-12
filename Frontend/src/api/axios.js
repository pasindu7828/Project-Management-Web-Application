import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8090/api/v1/leave-request",
  withCredentials: true,
});

export default api;
