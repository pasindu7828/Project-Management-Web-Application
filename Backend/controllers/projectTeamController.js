import ProjectTeam from "../models/ProjectTeam.js";
import Employees from "../models/EmployeeModel.js";
import Project from "../models/ProjectModel.js";
import mongoose from "mongoose";

// ADD MEMBER
export const addMember = async (req, res) => {
    try {
        const { projectId, userId, assignedRole } = req.body;

        if (!projectId || !userId || !assignedRole) {
            return res.status(400).json({
                success: false,
                message: "projectId, userId and assignedRole are required"
            });
        }

        const project = await Project.findById(projectId);
        if (!project)
            return res.status(404).json({ success: false, message: "Project not found" });

        const employee = await Employees.findById(userId);
        if (!employee)
            return res.status(404).json({ success: false, message: "Employee not found" });

        const alreadyAdded = await ProjectTeam.findOne({ projectId, userId });
        if (alreadyAdded)
            return res.status(400).json({
                success: false,
                message: "Employee already added to this project"
            });

        const member = await ProjectTeam.create({
            projectId,
            userId,
            assignedRole
        });

        res.status(201).json({
            success: true,
            message: "Member added successfully",
            data: member
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

//  GET MEMBERS OF A PROJECT 
export const getMembers = async (req, res) => {
    try {
        const { pid } = req.params;

        const members = await ProjectTeam.find({ projectId: pid })
            .populate("userId", "FirstName LastName email");

        res.status(200).json({
            success: true,
            data: members
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE MEMBER ROLE
export const updateMemberRole = async (req, res) => {
    try {
        const { projectId, userId, assignedRole } = req.body;

        if (!projectId || !userId || !assignedRole) {
            return res.status(400).json({
                success: false,
                message: "projectId, userId and assignedRole are required"
            });
        }

        const employee = await Employees.findById(userId);
        if (!employee)
            return res.status(404).json({ success: false, message: "Employee not found" });

        const updated = await ProjectTeam.findOneAndUpdate(
            { projectId, userId },
            { assignedRole },
            { new: true }
        );

        if (!updated)
            return res.status(404).json({
                success: false,
                message: "Member not found in this project"
            });

        res.status(200).json({
            success: true,
            message: "Role updated successfully",
            data: updated
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// REMOVE MEMBER
export const removeMember = async (req, res) => {
    try {
        const { projectId, userId } = req.body;

        if (!projectId || !userId) {
            return res.status(400).json({
                success: false,
                message: "projectId and userId are required"
            });
        }

        const employee = await Employees.findById(userId);
        if (!employee)
            return res.status(404).json({ success: false, message: "Employee not found" });

        const deleted = await ProjectTeam.findOneAndDelete({ projectId, userId });
        if (!deleted)
            return res.status(404).json({
                success: false,
                message: "Member not found in this project"
            });

        res.status(200).json({
            success: true,
            message: "Member removed successfully"
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET PROJECTS OF A USER
export const getProjectsOfUser = async (req, res) => {
    try {
        const { uid } = req.params;

        const projects = await ProjectTeam.find({ userId: uid })
            .populate("projectId", "name description endDate status");

        res.status(200).json({
            success: true,
            data: projects
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET ALL USERS (EMPLOYEES) FOR DROPDOWN
export const getAllUsers = async (req, res) => {
    try {
        const users = await Employees.find(
            {},
            "FirstName LastName email"
        );

        res.status(200).json({
            success: true,
            data: users
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};