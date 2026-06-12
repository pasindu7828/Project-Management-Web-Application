import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employees" }],
    deadline: { type: Date },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    status: { type: String,
        enum: ["Pending", "In Progress", "Completed"],
        default: "Pending" },
    milestone: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Milestones"  // Milestone model ekata reference
    }
}, { timestamps: true });

export default mongoose.model("Task", taskSchema);
