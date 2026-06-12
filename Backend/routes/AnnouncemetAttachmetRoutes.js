import express from "express";
import { createDiskUploader } from "../middlewares/uploadFactory.js";
import {
  uploadFile,
  downloadFile,
  updateFile,
  deleteFile,
  saveFileToDb,
} from "../controllers/AnnouncemetAttachmetController.js";
import path from "path";

const router = express.Router();

// Setup local uploader
const upload = createDiskUploader({
  getDestination: () => path.join(process.cwd(), "uploads"),
});

// Routes
router.post("/upload", upload.single("file"), saveFileToDb, uploadFile);
router.get("/download/:id", downloadFile);
router.put("/update/:id", upload.single("file"), updateFile);
router.delete("/delete/:id", deleteFile);

export default router;
