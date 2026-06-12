// Backend/app.js
import express from "express";
import morgan from "morgan";
import cors from "cors";
import leaveRoutes from "./routes/leaveRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Create Express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/leave-request", leaveRoutes);
app.use("/api/v1/task", taskRoutes);
app.use("/api/v1/userAuth", userRoutes);

// Root route
app.get("/", (req, res) => {
  res.send({
    message: "Welcome to WorkSync API",
  });
});

export default app;
