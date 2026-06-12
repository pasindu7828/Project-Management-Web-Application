import mongoose from "mongoose";

const ProjectTeamSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employees",
        required: true
    },
    assignedRole: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

export default mongoose.model("ProjectTeam", ProjectTeamSchema);
