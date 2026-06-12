import mongoose from "mongoose";
import PDFDocument from "pdfkit";

import Project from "../models/ProjectModel.js";
import ProjectTeam from "../models/ProjectTeam.js";
import Milestone from "../models/milestoneModel.js";
import Task from "../models/Task.js";
import ProjectAttachment from "../models/ProjectAttachmentModel.js";
import TaskAttachment from "../models/TaskAttachmentModel.js";
import Notification from "../models/Notification.js";

// Color palette for professional design
const COLORS = {
  primary: '#087990',      
  secondary: '#64748b',    
  success: '#10b981',      
  warning: '#f59e0b',      
  danger: '#ef4444',       
  dark: '#1e293b',         
  light: '#f8fafc',        
  border: '#e2e8f0',       
  text: '#334155'          
};

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toISOString().slice(0, 10);
};

const namesOrDash = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return "-";
  const names = arr
    .map((u) => {
      if (!u || typeof u !== "object") return null;
      const fn = u.FirstName || "";
      const ln = u.LastName || "";
      const full = `${fn} ${ln}`.trim();
      return full || null;
    })
    .filter(Boolean);

  return names.length ? names.join(", ") : "-";
};

const ensureSpace = (doc, needed = 60) => {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) doc.addPage();
};

// Helper function to draw a colored box with rounded corners
const drawBox = (doc, x, y, width, height, color, radius = 3) => {
  doc.save();
  doc.roundedRect(x, y, width, height, radius).fill(color);
  doc.restore();
};

// Helper function to create section headers
const drawSectionHeader = (doc, title, icon = null) => {
  const startY = doc.y;
  
  // Background accent
  drawBox(doc, doc.page.margins.left - 5, startY - 5, doc.page.width - doc.page.margins.left - doc.page.margins.right + 10, 35, COLORS.light);
  
  // Left accent bar
  drawBox(doc, doc.page.margins.left - 5, startY - 5, 4, 35, COLORS.primary);
  
  doc.fontSize(14)
    .fillColor(COLORS.dark)
    .font('Helvetica-Bold')
    .text(title, doc.page.margins.left + 10, startY + 5);
  
  doc.moveDown(1.2);
};

// Helper function to get status color based on text
const getStatusColor = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("complete") || s.includes("done")) return COLORS.success;
  if (s.includes("progress") || s.includes("ongoing")) return COLORS.warning;
  if (s.includes("pending") || s.includes("not started")) return COLORS.secondary;
  if (s.includes("overdue") || s.includes("delayed")) return COLORS.danger;
  return COLORS.secondary;
};

// Draw priority indicator
const drawPriorityIndicator = (doc, x, y, priority) => {
  const p = (priority || "").toLowerCase();
  let color = COLORS.secondary;
  if (p.includes("high") || p.includes("urgent")) color = COLORS.danger;
  else if (p.includes("medium")) color = COLORS.warning;
  else if (p.includes("low")) color = COLORS.success;
  
  doc.save();
  doc.circle(x + 4, y + 4, 4).fill(color);
  doc.restore();
};

// Create a beautiful header
const createPDFHeader = (doc, project) => {
  // Header background
  drawBox(doc, 0, 0, doc.page.width, 120, COLORS.primary);
  
  // White accent design
  doc.save();
  doc.opacity(0.1);
  doc.circle(doc.page.width - 50, 30, 80).fill('white');
  doc.circle(doc.page.width + 20, 80, 60).fill('white');
  doc.opacity(1);
  doc.restore();
  
  // Title
  doc.fontSize(24)
    .fillColor('white')
    .font('Helvetica-Bold')
    .text('Project Progress Report', 50, 35, { align: 'left' });
  
  // Subtitle
  doc.fontSize(11)
    .fillColor('white')
    .font('Helvetica')
    .text('Comprehensive Project Analysis & Status Overview', 50, 65);
  
  // Date generated
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.fontSize(9)
    .fillColor('white')
    .text(`Generated on ${today}`, 50, 90);
  
  doc.y = 140;
};

// Create footer
const createPDFFooter = (doc, pageNum) => {
  const bottom = doc.page.height - 30;
  
  doc.fontSize(8)
    .fillColor(COLORS.secondary)
    .text(`Page ${pageNum}`, 
      doc.page.margins.left, 
      bottom, 
      { align: 'center', width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
    );
};

// Draw table helper function
const drawTable = (doc, headers, rows, options = {}) => {
  const {
    startX = doc.page.margins.left,
    startY = doc.y,
    columnWidths = [],
    headerBg = COLORS.primary,
    headerTextColor = 'white',
    rowHeight = 25,
    headerHeight = 30,
    fontSize = 9,
    alternateRows = true
  } = options;

  let currentY = startY;
  const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0);

  // Draw header
  doc.save();
  doc.rect(startX, currentY, totalWidth, headerHeight).fill(headerBg);
  
  doc.fontSize(fontSize + 1)
    .fillColor(headerTextColor)
    .font('Helvetica-Bold');
  
  let currentX = startX;
  headers.forEach((header, i) => {
    doc.text(header, currentX + 5, currentY + (headerHeight - fontSize - 1) / 2, {
      width: columnWidths[i] - 10,
      align: 'left'
    });
    currentX += columnWidths[i];
  });
  
  currentY += headerHeight;
  doc.restore();

  // Draw rows
  rows.forEach((row, rowIndex) => {
    ensureSpace(doc, rowHeight + 10);
    currentY = doc.y;
    
    // Alternate row background
    if (alternateRows && rowIndex % 2 === 0) {
      doc.save();
      doc.rect(startX, currentY, totalWidth, rowHeight).fill(COLORS.light);
      doc.restore();
    }

    // Row border
    doc.save();
    doc.rect(startX, currentY, totalWidth, rowHeight)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();
    doc.restore();

    // Draw cells
    currentX = startX;
    row.forEach((cell, i) => {
      // Draw vertical lines
      if (i > 0) {
        doc.save();
        doc.moveTo(currentX, currentY)
          .lineTo(currentX, currentY + rowHeight)
          .strokeColor(COLORS.border)
          .lineWidth(0.5)
          .stroke();
        doc.restore();
      }

      const cellValue = cell.value || cell;
      const cellColor = cell.color || COLORS.text;
      
      doc.fontSize(fontSize)
        .fillColor(cellColor)
        .font(cell.bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(cellValue, currentX + 5, currentY + (rowHeight - fontSize) / 2, {
          width: columnWidths[i] - 10,
          align: cell.align || 'left',
          ellipsis: true
        });
      
      currentX += columnWidths[i];
    });

    currentY += rowHeight;
    doc.y = currentY;
  });

  doc.moveDown(0.5);
};

// [Previous CRUD controllers remain the same]
export const createProjectController = async (req, res) => {
    try {
        const { name, description, startDate, endDate, status, teamLeaderId } = req.body;

        if (!name || !description || !startDate || !teamLeaderId) {
            return res.status(400).json({ 
                success : false,
                message: "Name, Description, Start Date and Team Leader are required" 
            });
        }

        if (endDate && new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({
                success: false,
                message: "End date cannot be before start date."
            });
        }

        const existingProject = await Project.findOne({
            name: { $regex: `^${name}$`, $options: 'i' }
        });

        if (existingProject) {
            return res.status(400).json({
                success: false,
                message: "A project with this name already exists"
            });
        }

        const createdBy = req.user.userid;

        const project = await Project.create({
            name,
            description,
            startDate,
            endDate,
            status,
            createdBy,
            teamLeader: teamLeaderId,
        });

        await ProjectTeam.create({
            projectId: project._id,
            userId: teamLeaderId,
            assignedRole: "Team Lead"
        });

        res.status(201).json({
            success:true,
            message: "Project created successfully",
            data: project
        });
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({
            success: false,
            message: "Error creating project",
            error: error.message
        });
    }
};

export const getSingleProjectController = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findById(id)
            .populate("createdBy", "name email")
            .populate("teamLeader", "name email")
            .lean();

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Project fetched successfully",
                data: project
            });
    } catch (error) {
        if (error?.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        console.error("Error fetching project:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching project",
            error: error.message
        });
    }
};

export const getAllProjectsController = async (req, res) => {
    try {
        const projects = await Project.find()
            .sort({ createdAt: -1 })
            .populate("createdBy", "name email")
            .populate("teamLeader", "name email");

        return res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching projects",
            error: error.message
        });
    }
};

export const updateProjectController = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, startDate, endDate, status, teamLeaderId } = req.body;

        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        if (name && name.trim()) {
            const existingProject = await Project.findOne({
                _id: { $ne: id },
                name: { $regex: `^${name.trim()}$`, $options: 'i' }
            });

            if (existingProject) {
                return res.status(400).json({
                    success: false,
                    message: "A project with this name already exists"
                });
            }
        }

        const finalStartDate = startDate ? new Date(startDate) : project.startDate;
        const finalEndDate = endDate ? new Date(endDate) : project.endDate;

        if (finalEndDate && finalStartDate && finalEndDate < finalStartDate) {
            return res.status(400).json({
                success: false,
                message: "End date cannot be before start date."
            });
        }

        if (name !== undefined) project.name = name;
        if (description !== undefined) project.description = description;
        if (startDate !== undefined) project.startDate = startDate;
        if (endDate !== undefined) project.endDate = endDate;
        if (status !== undefined) project.status = status;
        if (teamLeaderId !== undefined) project.teamLeader = teamLeaderId;

        const updatedProject = await project.save();

        return res.status(200).json({
            success: true,
            message: "Project updated successfully",
            data: updatedProject
        });
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({
            success: false,
            message: "Error updating project",
            error: error.message
        });
    }
};

// Delete a project
export const deleteProjectController = async (req,res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required",
            });
        }

        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Cascade delete: Delete all related data
        
        // 1. Find all milestones related to this project
        const milestones = await Milestone.find({ projectID: id });
        const milestoneIds = milestones.map(m => m._id);

        if (milestoneIds.length > 0) {
            // 2. Find all tasks related to these milestones
            const tasks = await Task.find({ milestone: { $in: milestoneIds } });
            const taskIds = tasks.map(t => t._id);

            if (taskIds.length > 0) {
                // 3. Delete all task attachments
                await TaskAttachment.deleteMany({ taskId: { $in: taskIds } });
                console.log(`Deleted task attachments for ${taskIds.length} tasks`);
            }

            // 4. Delete all tasks
            await Task.deleteMany({ milestone: { $in: milestoneIds } });
            console.log(`Deleted ${taskIds.length} tasks`);

            // 5. Delete all milestones
            await Milestone.deleteMany({ projectID: id });
            console.log(`Deleted ${milestoneIds.length} milestones`);
        }

        // 6. Delete all project team members
        await ProjectTeam.deleteMany({ projectId: id });
        console.log(`Deleted project team members for project ${id}`);

        // 7. Delete all project attachments
        await ProjectAttachment.deleteMany({ projectId: id });
        console.log(`Deleted project attachments for project ${id}`);

        // 8. Delete the project itself
        await Project.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Project and all related data deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting project",
            error: error.message
        });
    }
};

// Enhanced PDF Report Generator with Tables
export const projectProgressReportController = async (req, res) => {
  let doc;
  let pageNum = 1;

  try {
    const { id: projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid project ID" });
    }

    // Fetch all data
    const project = await Project.findById(projectId)
      .populate("createdBy", "FirstName LastName email")
      .populate("teamLeader", "FirstName LastName email")
      .lean();

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const milestones = await Milestone.find({ projectID: projectId })
      .populate("assignedTo", "FirstName LastName email")
      .sort({ Start_Date: 1 })
      .lean();

    const milestoneIds = milestones.map((m) => m._id);

    const tasks = milestoneIds.length
      ? await Task.find({ milestone: { $in: milestoneIds } })
          .populate("assignedTo", "FirstName LastName email")
          .populate("milestone", "milestoneName")
          .sort({ createdAt: 1 })
          .lean()
      : [];

    const tasksByMilestone = new Map();
    for (const t of tasks) {
      const msId =
        t.milestone && typeof t.milestone === "object"
          ? String(t.milestone._id)
          : String(t.milestone);

      if (!tasksByMilestone.has(msId)) tasksByMilestone.set(msId, []);
      tasksByMilestone.get(msId).push(t);
    }

    // Create PDF document
    doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=project-progress-report-${projectId}.pdf`
    );

    res.on("close", () => {
      if (doc) doc.destroy();
    });

    doc.on("error", (e) => {
      console.error("PDFKit error:", e);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "PDF generation error" });
      } else {
        res.end();
      }
    });

    doc.pipe(res);

    // ===== PAGE 1: HEADER & PROJECT OVERVIEW =====
    // Add header only on the first page
    createPDFHeader(doc, project);
    doc.moveDown(0.5);

    // Project Overview Section
    drawSectionHeader(doc, 'Project Overview');
    
    // Description section
    if (project.description) {
     
      doc.fontSize(11)
      .fillColor(COLORS.dark)
      .font('Helvetica-Bold')
      .text('Description:', doc.page.margins.left, doc.y, {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          align: 'left'
      });
      doc.moveDown(0.3);

       drawBox(doc, doc.page.margins.left - 10, doc.y, doc.page.width - doc.page.margins.left - doc.page.margins.right + 20, 60, COLORS.light, 5);
      
      doc.fontSize(12).fillColor(COLORS.text).font('Helvetica')
        .text(project.description, doc.page.margins.left, doc.y + 10, { 
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 20,
          align: 'left'
        });
      
      doc.y += 15;
    }
    
    // Project information table
    const projectInfoHeaders = ['Field', 'Value'];
    const projectInfoRows = [
      ['Project Name', project.name || '-'],
      [
        'Status', 
        { value: project.status || '-', color: getStatusColor(project.status), bold: true }
      ],
      ['Start Date', fmtDate(project.startDate)],
      ['End Date', fmtDate(project.endDate)],
      ['Team Leader', namesOrDash([project.teamLeader].filter(Boolean))],
      ['Created By', namesOrDash([project.createdBy].filter(Boolean))]
    ];

    drawTable(doc, projectInfoHeaders, projectInfoRows, {
      columnWidths: [150, 370],
      headerHeight: 30,
      rowHeight: 25,
      fontSize: 10
    });
      
     doc.moveDown(2);

    // ===== MILESTONES SECTION =====
    if (!milestones.length) {
      drawSectionHeader(doc, 'Milestones');
      doc.fontSize(11).fillColor(COLORS.secondary).text('No milestones found for this project.');
      createPDFFooter(doc, pageNum);
      doc.end();
      return;
    }

    drawSectionHeader(doc, `Milestones & Tasks Summary (${milestones.length} Milestones)`);

    // Milestones overview table
    const milestonesHeaders = ['#', 'Milestone Name', 'Status', 'Start Date', 'End Date', 'Tasks'];
    const milestonesRows = milestones.map((ms, idx) => {
      const taskCount = tasksByMilestone.get(String(ms._id))?.length || 0;
      return [
        (idx + 1).toString(),
        ms.milestoneName || '-',
        { value: ms.Status || '-', color: getStatusColor(ms.Status), bold: true },
        fmtDate(ms.Start_Date),
        fmtDate(ms.End_Date),
        taskCount.toString()
      ];
    });

    drawTable(doc, milestonesHeaders, milestonesRows, {
      columnWidths: [30, 150, 90, 90, 90, 50],
      headerHeight: 30,
      rowHeight: 25,
      fontSize: 10
    });

    doc.moveDown(1.5);

    // ===== DETAILED MILESTONES WITH TASKS =====
    drawSectionHeader(doc, 'Detailed Milestones & Tasks');

    milestones.forEach((ms, idx) => {
      ensureSpace(doc, 120);

      // Milestone header
    doc.fontSize(13)
      .fillColor(COLORS.primary)
      .font('Helvetica-Bold')
      .text(
        `${idx + 1}. ${ms.milestoneName || "-"}`,
        doc.page.margins.left, 
        doc.y,
        {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          align: "left"
        }
      );

    doc.moveDown(1);

    // Description
      if (ms.Description) {
        
        doc.fontSize(11).
        fillColor(COLORS.secondary).
        font('Helvetica-Bold')
          .text('Description:', doc.page.margins.left, doc.y, {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          align: 'left'
      });
        doc.moveDown(0.1);

        const descY = doc.y;
        drawBox(doc, doc.page.margins.left - 10, descY, doc.page.width - doc.page.margins.left - doc.page.margins.right + 20, 60, COLORS.light, 5);
        
        doc.fontSize(12).fillColor(COLORS.text).font('Helvetica')
          .text(ms.Description, doc.page.margins.left, descY + 10,{
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 20,
            align: 'left'
          });
        
        doc.y = descY + 40;
      }
      

      // Milestone details small table
      const projectInfoHeaders = ['Value', 'Details'];
      const projectInfoRows = [
        [
          'Status', 
          { value: ms.Status || '-', color: getStatusColor(ms.Status), bold: true }
        ],
        ['Assigned To', namesOrDash(ms.assignedTo)],
        ['Start Date', fmtDate(ms.Start_Date)],
        ['End Date', fmtDate(ms.End_Date)],
      ];

      drawTable(doc, projectInfoHeaders, projectInfoRows, {
        columnWidths: [150, 370],
        headerHeight: 30,
        rowHeight: 25,
        fontSize: 10
      });
        
      doc.moveDown(2);

      // Tasks table
      const msTasks = tasksByMilestone.get(String(ms._id)) || [];
      
      if (msTasks.length > 0) {
        doc.moveDown(0.5);

        doc
          .fontSize(11)
          .fillColor(COLORS.dark)
          .font('Helvetica-Bold')
          .text(
            `Total Tasks - ${msTasks.length}`,
            doc.page.margins.left,
            doc.y,
            {
              align: "left"
            }
          );

        doc.moveDown(0.3);


        const tasksHeaders = ['Task Title', 'Status', 'Priority', 'Deadline', 'Assigned To'];
        const tasksRows = msTasks.map(t => [
          t.title || '-',
          { value: t.status || '-', color: getStatusColor(t.status), bold: true },
          { 
            value: t.priority || '-', 
            color: getStatusColor(t.priority),
            bold: true
          },
          fmtDate(t.deadline),
          namesOrDash(t.assignedTo)
        ]);

        drawTable(doc, tasksHeaders, tasksRows, {
          columnWidths: [160, 80, 60, 70, 150],
          headerHeight: 30,
          rowHeight: 25,
          fontSize: 10
        });
      } else {
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor(COLORS.secondary).font('Helvetica-Oblique')
          .text('No tasks under this milestone');
      }

      doc.moveDown(2);
      
      // Separator line
      doc.moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor(COLORS.border)
        .lineWidth(1)
        .stroke();
      
      doc.moveDown(2);
    });

    // Footer on last page
    createPDFFooter(doc, pageNum);

    doc.end();
  } catch (error) {
    console.error("projectProgressReportController error:", error);

    if (res.headersSent) {
      try {
        if (doc) doc.end();
      } catch {}
      return res.end();
    }

    return res.status(500).json({
      success: false,
      message: "Error generating project progress report",
      error: error.message,
    });
  }
};