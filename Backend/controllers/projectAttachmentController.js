import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Project from "../models/ProjectModel.js";
import ProjectAttachment from "../models/ProjectAttachmentModel.js";

const MAX_ATTACHMENTS_PER_PROJECT = 5;

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");

const cleanupFiles = async (files = []) => {
    await Promise.allSettled(
        files.map((f) => fs.promises.unlink(f.path).catch(() => null))
    );
};

function resolveSafeUploadPath(dbFilePath) {
  if (!dbFilePath) throw new Error("Attachment filePath is missing");

  // normalize slashes
  const normalized = dbFilePath.replace(/\\/g, "/");

  // If it's relative like "uploads/projects/..", resolve from project root
  // If it's absolute like "D:\...\uploads\...", resolve directly
  const absolutePath = path.isAbsolute(normalized)
    ? path.resolve(normalized)
    : path.resolve(process.cwd(), normalized);

  // Ensure it is inside UPLOADS_ROOT
  const rel = path.relative(UPLOADS_ROOT, absolutePath);
  const isInsideUploads =
    rel && !rel.startsWith("..") && !path.isAbsolute(rel);

  if (!isInsideUploads) {
    throw new Error("Invalid file path");
  }

  return absolutePath;
}



// Upload a new attachment to a project
export const addProjectAttachmentController = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });   
        }

        const files = req.files || [];
        if (files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded",
            });
        }

        // Check if project exists
        const project = await Project.findById(projectId).select("_id");
        if (!project) {
            await cleanupFiles(files);
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Enforce TOTAL max 5 per project (across multiple uploads)
        const existingCount = await ProjectAttachment.countDocuments({ projectId});
        const incomingCount = files.length;

        if (existingCount + incomingCount > MAX_ATTACHMENTS_PER_PROJECT) {
            await cleanupFiles(files);
            return res.status(400).json({
                success: false,
                message: `Max ${MAX_ATTACHMENTS_PER_PROJECT} attachments per project. Already: ${existingCount}, trying to add: ${incomingCount}`,
            });
        }

        const docs = files.map((file) => ({
            projectId,
            originalName: file.originalname,
            filename: file.filename,
            fileType: file.mimetype,
            fileSize: file.size,
            filePath: file.path.replace(/\\/g, "/"),
        }));

        const created = await ProjectAttachment.insertMany(docs, { ordered: true });
        const totalCount = existingCount + created.length;

        return res.status(201).json({
            success: true,
            message: "Attachments uploaded successfully",
            addedCount: created.length,
            totalCount,
            data: created,
        });
    } catch (error) {
        console.error("Error uploading attachment:", error);
         // if multer already stored files but error happened after, try cleanup
         if (req.files?.length) await cleanupFiles(req.files);
        return res.status(500).json({
            success: false,
            message: "Error uploading attachment",
            error: error.message,
        });
    }
};



// Get one attachment --> stream actual file
export const streamProjectAttachmentController = async (req, res) => {
    try {
        const { projectId, attachmentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }
        if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attachment ID",
            });
        }

        const attachment = await ProjectAttachment.findOne({ 
            _id: attachmentId, 
            projectId 
        }).select("filePath fileType originalName fileSize");

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: "Attachment not found",
            });
        }

        const absPath = resolveSafeUploadPath(attachment.filePath);
        if (!absPath) {
            return res.status(500).json({
                success: false,
                message: "Invalid attachment path",
            });
        }

        // check file exists
        const stat = await fs.promises.stat(absPath).catch(() => null);
        if (!stat || !stat.isFile()) {
            return res.status(404).json({
                success: false,
                message: "File missing on server",
            });
        }

        // headers
        res.setHeader("Content-Type", attachment.fileType || "application/octet-stream");
        // inline = preview in browser (PDF, images)
        res.setHeader(
            "Content-Disposition",
            `inline; filename="${encodeURIComponent(attachment.originalName || "file")}"`
        );

        const range = req.headers.range;
        if (range) {
            const fileSize = stat.size;
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) {
                return res.status(416).setHeader("Content-Range", `bytes */${fileSize}`).end();
            }

            res.status(206);
            res.setHeader("Accept-Ranges", "bytes");
            res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
            res.setHeader("Content-Length", end - start + 1);

            fs.createReadStream(absPath, { start, end }).pipe(res);
            return;
        }

        // normal stream
        res.setHeader("Content-Length", stat.size);
        fs.createReadStream(absPath).pipe(res);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error streaming attachment",
            error: error.message,
        });
    }
};



// Get all attachments (metadata) for a project
export const getAllProjectAttachmentsController = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        const attachments = await ProjectAttachment.find({ projectId })
            .sort({ createdAt: -1 })
            .select("_id projectId originalName filename fileType fileSize createdAt updatedAt");

        const data = attachments.map((a) => ({
            ...a.toObject(),
            fileUrl: `/api/v1/projects/${projectId}/attachments/file/${a._id}`,
        }));

        return res.status(200).json({
            success: true,
            count: data.length,
            data,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching attachments",
            error: error.message,
        });
    }
};



// Delete one attachment (metadata + file)
export const deleteProjectAttachmentController = async (req, res) => {
    try {
        const { projectId, attachmentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attachment ID",
            });
        }

        // Find attachment by both ids to ensure it belongs to the project
        const attachment = await ProjectAttachment.findOneAndDelete({ 
            _id: attachmentId, 
            projectId 
        }).select("filePath originalName");

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: "Attachment not found",
            });
        }

        // Resolve safe absolute path (prevent path traversal)
        let absPath;
        try {
            absPath = resolveSafeUploadPath(attachment.filePath);
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: e.message,
            });
        }

        // 1) Delete file (if missing, continue and still delete DB metadata)
        try {
            await fs.promises.unlink(absPath);
        } catch (error) {
            if (error.code !== "ENOENT") throw err;
        }

        // 2) Delete MongoDB metadata
        await attachment.deleteOne();

        // 3) If this was the last attachment, delete the project folder
        const remaining = await ProjectAttachment.countDocuments({ projectId });

        if (remaining === 0) {
            const projectDir = path.resolve(UPLOADS_ROOT, "projects", String(projectId));
            
            // ensure the dir is inside uploads
            const rel = path.relative(UPLOADS_ROOT, projectDir);
            const isInsideUploads = rel && !rel.startsWith("..") && !path.isAbsolute(rel);

            if (isInsideUploads) {
                // remove folder 
                await fs.promises.rm(projectDir, { recursive: true, force: true });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Attachment deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting attachment",
            error: error.message,
        });
    }
}