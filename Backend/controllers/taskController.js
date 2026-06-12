import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Task from "../models/Task.js";
import TaskAttachment from "../models/TaskAttachmentModel.js";
import Milestone from "../models/milestoneModel.js";
import Employee from "../models/EmployeeModel.js";
import Notification from "../models/Notification.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { sendHighPriorityTaskEmail } from "../helpers/emailHelper.js";

const formatTaskForClient = (taskDoc) => {
    if (!taskDoc) return taskDoc;

    const task = typeof taskDoc.toObject === "function" ? taskDoc.toObject({ virtuals: true }) : taskDoc;
    const assigned = Array.isArray(task.assignedTo) ? task.assignedTo : [];

    return {
        ...task,
        assignedTo: assigned
            .map((u) => {
                if (typeof u === "object" && u !== null) {
                    return {
                        _id: u._id,
                        name: `${u.FirstName} ${u.LastName}`,
                        email: u.email
                    };
                }
                return null;
            })
            .filter(Boolean),
        milestone: task.milestone && typeof task.milestone === "object" ? task.milestone.milestoneName : null,
    };
};

const cleanupFiles = async (files = []) => {
    await Promise.allSettled(files.map((f) => fs.promises.unlink(f.path).catch(() => null)));
};

// REPORT TASKS (PDF / EXCEL)
export const taskReport = async (req, res) => {
    try {
        const { format } = req.query;

        const tasks = await Task.find()
            .populate("assignedTo", "FirstName LastName email")
            .populate("milestone", "milestoneName");

        /* =====================
           PDF FORMAT
        ===================== */
        if (format === "pdf") {
            const doc = new PDFDocument({ margin: 30, size: "A4" });

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=task-report.pdf"
            );

            doc.pipe(res);

            doc.fontSize(18).text("Task Report", { align: "center" });
            doc.moveDown();

            tasks.forEach((task, index) => {
                doc
                    .fontSize(12)
                    .text(`${index + 1}. ${task.title}`)
                    .text(`Status: ${task.status}`)
                    .text(`Priority: ${task.priority}`)
                    .text(
                        `Assigned To: ${task.assignedTo.map(u => `${u.FirstName} ${u.LastName}`).join(", ")}`
                    )
                    .text(`Milestone: ${task.milestone?.milestoneName || "-"}`)
                    .text(`Deadline: ${task.deadline || "-"}`)
                    .moveDown();
            });

            doc.end();
            return;
        }

        /* =====================
           EXCEL FORMAT
        ===================== */
        if (format === "excel") {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Task Report");

            worksheet.columns = [
                { header: "Title", key: "title", width: 30 },
                { header: "Status", key: "status", width: 15 },
                { header: "Priority", key: "priority", width: 15 },
                { header: "Assigned To", key: "assignedTo", width: 30 },
                { header: "Milestone", key: "milestone", width: 20 },
                { header: "Deadline", key: "deadline", width: 20 },
            ];

            tasks.forEach(task => {
                worksheet.addRow({
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    assignedTo: task.assignedTo.map(u => `${u.FirstName} ${u.LastName}`).join(", "),
                    milestone: task.milestone?.milestoneName || "-",
                    deadline: task.deadline || "-",
                });
            });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=task-report.xlsx"
            );

            await workbook.xlsx.write(res);
            res.end();
            return;
        }

        /* =====================
           INVALID FORMAT
        ===================== */
        return res.status(400).json({
            success: false,
            message: "Invalid format. Use ?format=pdf or ?format=excel",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to generate task report",
            error: error.message,
        });
    }
};


// CREATE TASK
export const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            assignedTo,   // can be name or id
            deadline,
            priority,
            milestone     // can be name or id
        } = req.body || {};

        const incomingFiles = req.files || [];
        if (incomingFiles.length > 5) {
            await cleanupFiles(incomingFiles);
            return res.status(400).json({
                success: false,
                message: "Max 5 attachments per task",
            });
        }

        const taskId =
            req.generatedTaskId && mongoose.Types.ObjectId.isValid(req.generatedTaskId)
                ? req.generatedTaskId
                : undefined;

        /* =========================
           EMPLOYEE EMAIL/ID → OBJECT ID
        ========================= */
        let assignedEmployeeIds = [];
        if (assignedTo) {
            const identifiers = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

            const employees = await Employee.find({
                $or: [
                    { email: { $in: identifiers } },
                    { _id: { $in: identifiers.filter(id => mongoose.Types.ObjectId.isValid(id)) } }
                ]
            }, "_id");
            assignedEmployeeIds = employees.map((emp) => emp._id);
        }

        /* =========================
           MILESTONE NAME → OBJECT ID
        ========================= */
        let milestoneId = null;
        if (milestone) {
            if (mongoose.Types.ObjectId.isValid(milestone)) {
                milestoneId = milestone;
            } else {
                const ms = await Milestone.findOne({ milestoneName: milestone });
                if (!ms) {
                    return res.status(400).json({
                        success: false,
                        message: `Milestone '${milestone}' not found`,
                    });
                }
                milestoneId = ms._id;
            }
        }

        const created = await Task.create({
            ...(taskId ? { _id: taskId } : {}),
            title,
            description,
            assignedTo: assignedEmployeeIds,
            deadline,
            priority,
            milestone: milestoneId,
            status: "Pending",
        });

        /* =========================
   ATTACHMENTS
========================= */
let savedAttachments = [];
if (incomingFiles.length) {
    try {
        const docs = incomingFiles.map((file) => ({
            taskId: created._id,
            originalName: file.originalname,
            filename: file.filename,
            fileType: file.mimetype,
            fileSize: file.size,
filePath: `uploads/tasks/${created._id.toString()}/${file.filename}` // fixed
        }));

        savedAttachments = await TaskAttachment.insertMany(docs);

    } catch (err) {
        await cleanupFiles(incomingFiles);
        await Task.findByIdAndDelete(created._id);
        throw err;
    }
}

        const task = await Task.findById(created._id)
            .populate("assignedTo", "FirstName LastName email")
            .populate("milestone", "milestoneName");

        // Send emails and create notifications for high priority tasks
        if (priority === "High" && assignedEmployeeIds.length > 0) {
            try {
                const taskDetails = {
                    title: title,
                    description: description,
                    deadline: deadline,
                    milestone: task.milestone?.milestoneName || null
                };

                // Send email and create notification for each assigned employee
                for (const employee of task.assignedTo) {
                    // Send email
                    await sendHighPriorityTaskEmail(
                        employee.email,
                        `${employee.FirstName} ${employee.LastName}`,
                        taskDetails
                    );

                    // Create notification
                    await Notification.create({
                        user: employee._id,
                        title: "High Priority Task Assigned",
                        message: `You have been assigned a high priority task: "${title}"`,
                        type: "HIGH_PRIORITY_TASK",
                        isRead: false
                    });
                }

                console.log(`Emails and notifications sent for high priority task: ${title}`);
            } catch (notifError) {
                console.error("Error sending notifications/emails for high priority task:", notifError);
                // Don't fail the task creation if notification fails
            }
        }

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: formatTaskForClient(task),
                    attachments: savedAttachments.map(att => att._id) // only IDs

        });
    } catch (error) {
        if (req.files?.length) await cleanupFiles(req.files);
        res.status(500).json({
            success: false,
            message: "Error creating task",
            error: error.message,
        });
    }
};


// DELETE TASK
export const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        await task.deleteOne();
        res.status(200).json({ success: true, message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting task",
            error: error.message
        });
    }
};

// UPDATE TASK
export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            assignedTo,   // name or id
            deadline,
            priority,
            status,
            milestone     // name or id
        } = req.body;

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (deadline !== undefined) task.deadline = deadline;
        if (priority !== undefined) task.priority = priority;
        if (status !== undefined) task.status = status;

        /* =========================
           UPDATE ASSIGNED EMPLOYEES
        ========================= */
        if (assignedTo !== undefined) {
            const identifiers = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
            const employees = await Employee.find({
                $or: [
                    { email: { $in: identifiers } },
                    { _id: { $in: identifiers.filter(id => mongoose.Types.ObjectId.isValid(id)) } }
                ]
            }, "_id");
            task.assignedTo = employees.map((emp) => emp._id);
        }

        /* =========================
           UPDATE MILESTONE
        ========================= */
        if (milestone !== undefined) {
            if (mongoose.Types.ObjectId.isValid(milestone)) {
                task.milestone = milestone;
            } else {
                const ms = await Milestone.findOne({ milestoneName: milestone });
                if (!ms) {
                    return res.status(400).json({
                        success: false,
                        message: `Milestone '${milestone}' not found`,
                    });
                }
                task.milestone = ms._id;
            }
        }

        await task.save();

        const populated = await Task.findById(task._id)
            .populate("assignedTo", "FirstName LastName email")
            .populate("milestone", "milestoneName");

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: formatTaskForClient(populated),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating task",
            error: error.message,
        });
    }
};


// GET ALL TASKS FOR EMPLOYEE
export const getAllTasks = async (req, res) => {
  try {
    const query = {};
    const userId = req.user.userid || req.user._id;

    // Filters (Admin + Team Leader can use)
    if (req.query.projectId) query.project = req.query.projectId;
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;

    // Team Leader (role = 1) can filter by assigned employee
    if (req.query.assignedTo && req.user.role === 1) {
      query.assignedTo = req.query.assignedTo;
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "FirstName LastName email")
      .populate("milestone", "milestoneName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tasks.map(formatTaskForClient),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tasks",
      error: error.message,
    });
  }
};

// GET ALL TASKS ASSIGNED TO THE LOGGED-IN EMPLOYEE

export const getAllUserTasks = async (req, res) => {
  try {
    const employeeId = new mongoose.Types.ObjectId(req.user.userid);
    const tasks = await Task.find({ assignedTo: employeeId })
      .populate("assignedTo", "FirstName LastName email")
      .populate("milestone", "milestoneName")
      .sort({ createdAt: -1 });
    console.log("req.user:", req.user);

    res
      .status(200)
      .json({ success: true, data: tasks.map(formatTaskForClient) });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching user tasks",
      error: error.message,
    });
  }
};

// UPDATE STATUS
export const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        task.status = status;
        await task.save();
        const populated = await Task.findById(task._id)
            .populate("assignedTo", "FirstName LastName email")
            .populate("milestone", "milestoneName");
        res.status(200).json({ success: true, message: "Task status updated", data: formatTaskForClient(populated) });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating task status", error: error.message });
    }
};

// GET SINGLE TASK WITH FULL DETAILS INCLUDING ATTACHMENTS
export const getTaskDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid task ID" });
        }

        const task = await Task.findById(id)
            .populate("assignedTo", "FirstName LastName email")
            .populate("milestone", "milestoneName");

        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        // Fetch attachments for this task
        const attachments = await TaskAttachment.find({ taskId: id });

        // Calculate progress percentage based on status
        let progressPercentage = 0;
        if (task.status === "In Progress") {
            progressPercentage = 50;
        } else if (task.status === "Completed") {
            progressPercentage = 100;
        }

        const taskDetails = {
            _id: task._id,
            title: task.title,
            description: task.description,
            assignedTo: task.assignedTo,
            deadline: task.deadline,
            priority: task.priority,
            status: task.status,
            milestone: task.milestone,
            progressPercentage,
            attachments: attachments.map(att => ({
                _id: att._id,
                filename: att.filename,
                originalName: att.originalName,
                fileType: att.fileType,
                fileSize: att.fileSize,
            })),
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
        };

        res.status(200).json({ success: true, data: taskDetails });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching task details", error: error.message });
    }
};

// DOWNLOAD TASK ATTACHMENT
export const downloadTaskAttachment = async (req, res) => {
    try {
        const { taskId, attachmentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(attachmentId)) {
            return res.status(400).json({ success: false, message: "Invalid ID provided" });
        }

        // Verify the task exists
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        // Find the attachment
        const attachment = await TaskAttachment.findOne({ _id: attachmentId, taskId: taskId });
        if (!attachment) {
            return res.status(404).json({ success: false, message: "Attachment not found" });
        }

        const filePath = path.resolve(attachment.filePath);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: "File not found on server" });
        }

        // Set headers for download
        res.setHeader("Content-Disposition", `attachment; filename="${attachment.originalName}"`);
        res.setHeader("Content-Type", attachment.fileType);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on("error", (err) => {
            console.error("File stream error:", err);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: "Error streaming file" });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error downloading attachment", error: error.message });
    }
};

// PREVIEW TASK ATTACHMENT (for viewing in browser without forcing download)
export const previewTaskAttachment = async (req, res) => {
    try {
        const { taskId, attachmentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(attachmentId)) {
            return res.status(400).json({ success: false, message: "Invalid ID provided" });
        }

        // Verify the task exists
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        // Find the attachment
        const attachment = await TaskAttachment.findOne({ _id: attachmentId, taskId: taskId });
        if (!attachment) {
            return res.status(404).json({ success: false, message: "Attachment not found" });
        }

        const filePath = path.resolve(attachment.filePath);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: "File not found on server" });
        }

        // Set headers for inline viewing (not download)
        res.setHeader("Content-Disposition", `inline; filename="${attachment.originalName}"`);
        res.setHeader("Content-Type", attachment.fileType);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on("error", (err) => {
            console.error("File stream error:", err);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: "Error streaming file" });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error previewing attachment", error: error.message });
    }
};
