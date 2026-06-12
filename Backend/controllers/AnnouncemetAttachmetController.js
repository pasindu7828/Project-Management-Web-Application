import File from "../models/AnnouncemetAttachmet.js";
import fs from "fs";
import path from "path";
import Announcement from "../models/Announcement.js";

//  save file to DB (migrated from fileUploadMiddleware)
export const saveFileToDb = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const file = File.fromMulterFile(req.file);
    await file.save();

    // Attach saved file to request
    req.uploadedFile = file;
    next();
    
  } catch (error) {
    console.error("Error saving file to DB:", error);
    res.status(500).send({
      message: "Error processing file upload",
      error,
    });
  }
};

// Upload File
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }

    const file = req.uploadedFile;

    res.status(201).send({
      message: "File uploaded successfully",
      file,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error uploading file",
      error,
    });
  }
};

// Download File
export const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).send({ message: "File not found" });
    }

    const filePath = path.resolve(file.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ message: "File not found on server" });
    }

    res.download(filePath, file.originalName);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error downloading file",
      error,
    });
  }
};

// Update File
export const updateFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const oldFile = await File.findById(fileId);

    if (!oldFile) {
      return res.status(404).send({ message: "File not found" });
    }

    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded for update" });
    }

    // Delete old file from filesystem
    const oldFilePath = path.resolve(oldFile.path);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    const { filename, originalname, path: newPath, mimetype, size } = req.file;

    // Update database record
    oldFile.filename = filename;
    oldFile.originalName = originalname;
    oldFile.path = newPath;
    oldFile.mimetype = mimetype;
    oldFile.size = size;

    await oldFile.save();

    res.status(200).send({
      message: "File updated successfully",
      file: oldFile,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error updating file",
      error,
    });
  }
};

// Delete File
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).send({ message: "File not found" });
    }

    // Delete file from filesystem
    const filePath = path.resolve(file.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.id);

    // Remove file reference from Announcements
    await Announcement.updateMany(
      { attachments: req.params.id },
      { $pull: { attachments: req.params.id } }
    );

    res.status(200).send({ message: "File deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error deleting file",
      error,
    });
  }
};
