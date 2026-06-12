import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import helmet from "helmet";
import MongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import connectDB from "./config/db.js";
// import app from "./app.js";
import morgan from "morgan";
import cors from "cors";
import projectTeamRoutes from "./routes/projectTeamRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import announcementRoutes from "./routes/announcement_route.js";
import cookieParser from "cookie-parser";
import milestoneRoutes from "./routes/milestoneRoute.js";
import { startAutoCheckoutJob } from "./helpers/autoCheckoutHelper.js";
// Configure environment
import { autoDeleteExpiredAnnouncements } from "./middlewares/announcementExpirymiddleware.js";
import AnnouncemetAttachmetRoutes from "./routes/AnnouncemetAttachmetRoutes.js";
import EmployeeRoute from "./routes/EmployeeRoute.js";

// Configure environment

dotenv.config();

// Database config
connectDB();

const app = express();


//Data sanitizations
// app.use(MongoSanitize());
// app.use(xss());
app.use(cors({
  origin: "https://work-sync-j3bx.vercel.app", // FRONTEND URL
  credentials: true,              // REQUIRED because you use withCredentials
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


// Middlewares
// app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());
// run every 1 minute
setInterval(autoDeleteExpiredAnnouncements, 60 * 1000);
//setInterval(autoDeleteExpiredAnnouncements, 86400000);

//routes
app.use("/api/v1/userAuth", userRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/leave-request", leaveRoutes);
app.use("/api/v1/task", taskRoutes);
app.use("/api/v1/department", departmentRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/announcement", announcementRoutes);
app.use("/api/v1/project-team", projectTeamRoutes);
app.use("/api/v1/millestone", milestoneRoutes);
app.use("/api/v1/employee", EmployeeRoute);


app.get("/", (req, res) => {
  res.send({
    message: "Welcome to WorkSync",
  });
});


// For Auto-Checkout Timer
startAutoCheckoutJob(); 

const PORT = process.env.PORT || 8090;

app.listen(PORT, () => {
    console.log(`Server Running on ${process.env.DEV_MODE} mode`.bgCyan.white);
    console.log(`Server is running on port ${PORT}`.bgCyan.white)
});

