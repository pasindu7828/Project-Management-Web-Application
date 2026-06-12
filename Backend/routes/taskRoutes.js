import fs from "fs"; 
import express from "express";
import mongoose from "mongoose";
import {
    createTask,
    deleteTask,
    updateTask,
    getAllTasks,
    getAllUserTasks,
    updateTaskStatus,
    getTaskDetails,
    downloadTaskAttachment,
    previewTaskAttachment,
    taskReport,          // ⬅️ report function (assume)
} from "../controllers/taskController.js";

import {
    requiredSignIn,
    isEmployee,
    isAdmin,
} from "../middlewares/AuthMiddleware.js";

import { createDiskUploader } from "../middlewares/uploadFactory.js";

const router = express.Router();

/* =========================
   PREPARE TASK ID (uploads)
========================= */
const prepareCreateTask = (req, res, next) => {
    req.generatedTaskId = new mongoose.Types.ObjectId();
    next();
};

const createTaskUploader = createDiskUploader({
  getDestination: (req) => {
    const dir = `uploads/tasks/${req.generatedTaskId?.toString() || "unknown"}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  },
  maxFileSizeMB: 10,
});


/* =========================
   CREATE TASK
   POST /createTask
========================= */
router.post(
    "/createTask",
    requiredSignIn,
    isEmployee,
    prepareCreateTask,
    createTaskUploader.array("attachments", 5),
    createTask
);

/* =========================
   LIST ALL TASKS (ADMIN / TL / EMPLOYEE)
   GET /getAllTasks
========================= */
router.get(
    "/getAllTasks",
    requiredSignIn,
    getAllTasks
);

/* =========================
   LIST EMPLOYEE TASKS
   GET /getAllUserTasks
========================= */
router.get(
    "/getAllUserTasks",
    requiredSignIn,
    isEmployee,
    getAllUserTasks
);

/* =========================
   UPDATE TASK
   PUT /updateTask/:id
========================= */
router.put(
    "/updateTask/:id",
    requiredSignIn,
    isEmployee,
    updateTask
);

/* =========================
   UPDATE TASK STATUS
   PATCH /updateTaskStatus/:id
========================= */
router.patch(
    "/updateTaskStatus/:id",
    requiredSignIn,
    isEmployee,
    updateTaskStatus
);

/* =========================
   DELETE TASK
   DELETE /deleteTask/:id
========================= */
router.delete(
    "/deleteTask/:id",
    requiredSignIn,
    isEmployee,
    deleteTask
);

/* =========================
   TASK REPORT
   GET /taskReport
========================= */
router.get(
    "/taskReport",
    requiredSignIn,
    isAdmin,
    taskReport
);

/* =========================
   TASK DETAILS
========================= */
router.get(
    "/taskDetails/:id",
    requiredSignIn,    getTaskDetails
);

/* =========================
   ATTACHMENT DOWNLOAD
========================= */
router.get(
    "/:taskId/attachments/:attachmentId/download",
    requiredSignIn,
    isEmployee,
    downloadTaskAttachment
);

/* =========================
   ATTACHMENT PREVIEW
========================= */
router.get(
    "/:taskId/attachments/:attachmentId/preview",
    requiredSignIn,
    isEmployee,
    previewTaskAttachment
);

export default router;
