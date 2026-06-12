import mongoose from "mongoose";

const projectAttachmentSchema = new mongoose.Schema({
    projectId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Project",
        required: true,
        index: true,
    },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    filePath: { type: String, required: true },
    
}, { timestamps: true });

export default mongoose.model("ProjectAttachment", projectAttachmentSchema);