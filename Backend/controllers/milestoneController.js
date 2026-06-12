import milestone from "../models/milestoneModel.js";
import Project from '../models/ProjectModel.js';
import Task from '../models/Task.js';

// Create Milestone
export const createMilestone = async (req, res) => {
    try {
        const {projectID, milestoneName, Description, Start_Date, End_Date, Status} = req.body;

        // Validation
        if (!projectID || !milestoneName || !Start_Date || !End_Date) {
            return res.status(400).json({
                success: false,
                message: "Project ID, Milestone Name, Start Date, and End Date are reuired. "
            });
        }

        // Check if project existes
        const project = await Project.findById(projectID);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // Validate dates
        if (new Date(Start_Date) > new Date(End_Date)) {
            return res.status(400).json({
                success: false,
                message: "Start date cannot be after end date"
            });
        }

        const newMilestone = new milestone({
            projectID,
            milestoneName,
            Description,
            Start_Date,
            End_Date,
            Status: Status || 'Pending'
        });

        const savedMilestone = await newMilestone.save();

        res.status(201).json({
            success: true,
            message: "Milestone created successfully",
            data: savedMilestone
        });

    } catch (error) {
        console.error("Error Creating milestone",error );
        res.status(500).json({
            success:false,
            message: "Error Creating Milestone"
        });
    }
};

// Get all milestones
export const getAllMilestones = async (req, res) => {
    try {
        const { pid } = req.params;

        const milestones = await milestone.find({ projectID: pid })
            .populate('assignedTo', 'name email')
            .sort({ Start_Date: 1 });

        res.status(200).json({
            success: true,
            count: milestones.length,
            data: milestones
        });
        
    } catch (error) {
        console.error('Error getting milestones', error);
        res.status(500).json({
            success: false,
            message: "Error getting milestones"
        });
    }
};

// Get single milestone
export const getMilestone = async (req, res) => {
    try {
        const { id } = req.params;

        const foundMilestone = await milestone.findById(id)
            .populate('projectID', 'name status deadline')
            .populate('assignedTo', 'name email role');

        if(!foundMilestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found'
            });
        }

        res.status(200).json({
            success: true,
            data: foundMilestone
        });

    } catch (error) {
        console.error('Error getting milestone', error);
        res.status(500).json({
            success: false,
            message: "Error getting milestone"
        });
    }
};

// Get milestone details
export const getMilestoneDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const foundMilestone = await milestone.findById(id)
            .populate('projectID', 'name status deadline')
            .populate('assignedTo', 'name email role');
        
        if (!foundMilestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found'
            });
        }

        // Check if user is assigned
        const isAssigned = foundMilestone.assignedTo.some(
            user => user._id.toString() === userId.toString()
        );

        res.status(200).json({
            success: true,
            data: {
                milestone: foundMilestone,
                isAssigned
            }
        });

    } catch (error) {
        console.error('Error getting milestone details', error);
        res.status(500).json({
            success: false,
            message: "Error getting milestone details"
        });
    }
};

// Update Milestone
export const updateMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const { milestoneName, Description, Start_Date, End_Date, Status, assignedTo } = req.body;

        const foundMilestone = await milestone.findById(id);

        if (!foundMilestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found'
            });
        }

        // Validate data if updated
        if (Start_Date && End_Date && new Date(Start_Date) > new Date(End_Date)) {
            return res.status(400).json({
                success: false,
                message: "Start date cannot be after end date"
            });
        }

        // Update fields
        if (milestoneName) foundMilestone.milestoneName = milestoneName;
        if (Description !== undefined) foundMilestone.Description = Description;
        if (Start_Date) foundMilestone.Start_Date = Start_Date;
        if (End_Date) foundMilestone.End_Date = End_Date;
        if (Status) foundMilestone.Status = Status;
        if (assignedTo) foundMilestone.assignedTo = assignedTo;

        // If making as complete , set complete date
        if (Status === 'Complete' && foundMilestone.Status !== 'Completed') {
            foundMilestone.Completion_Date = new Date();
        }

        const updatedMilestone = await foundMilestone.save();

        res.status(200).json({
            success: true,
            message: "Milestone updated successfully",
            data: updatedMilestone
        });

    } catch (error) {
        console.error('Error updating milestone', error);
        res.status(500).json({
            success: false,
            message: "Error updating milestone"
        });
    }
};

// Update milestone status
export const updateMilestoneStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { Status } = req.body;

        // Validate status
        if (!['Pending', 'In Progress', 'Complete'].includes(Status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value. Must be: Pending, In Progress, or Complete"
            });
        }

        const foundMilestone = await milestone.findById(id);

        if (!foundMilestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found'
            });
        }

        foundMilestone.Status = Status;

        // Set completion date if making as complete 
        if (Status === 'Complete' && !foundMilestone.Completion_Date) {
            foundMilestone.Completion_Date = new Date();
        }

        // Clear completion date if changing to another status
        if (Status !== 'Complete') {
            foundMilestone.Completion_Date = null;
        }

        const updatedMilestone = await foundMilestone.save();

        res.status(200).json({
            success: true,
            message: "Milestone status updated successfully",
            data: updatedMilestone
        });

    } catch (error) {
        console.error('Error updating milestone status', error);
        res.status(500).json({
            success: false,
            message: "Error updating milestone status"
        });
    }
};

// Delete milestone
export const deleteMilestone = async (req, res) => {
    try {
        const { id } = req.params;

        const foundMilestone = await milestone.findById(id);

        if (!foundMilestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found'
            });
        }

        // Delete all tasks associated with this milestone
        const deleteResult = await Task.deleteMany({ milestone: id });

        // Delete the milestone
        await foundMilestone.deleteOne();

        res.status(200).json({
            success: true,
            message: "Milestone deleted successfully",
            deletedTasksCount: deleteResult.deletedCount
        });

    } catch (error) {
        console.error('Error deleting milestone', error);
        res.status(500).json({
            success: false,
            message: "Error deleting milestone"
        });
    }
};