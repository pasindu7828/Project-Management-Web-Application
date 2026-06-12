import mongoose, { Schema } from "mongoose";
import { validate } from "uuid";

const milestoneSchema = new mongoose.Schema({
    projectID:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: [true, "Project ID is required"],
        index: true
    }],
    milestoneName: {
        type: String,
        required: [true, "Milestone Name is required"],
        trim: true,
        maxlength: [100, "Milestone Name cannot exceed 100 characters"]
    },
    Description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"]
    },
    Start_Date: {
        type: Date,
        required: [true, "Start Date is required"]
    },
    End_Date: {
        type: Date,
        required: [true, "End Date is required"],
        validate: {
            validator: function(value) {
                return value >= this.Start_Date;
            },
            message: "End Date must be greater than or equal to Start Date"
        }
    },
    Status: {
        type: String,
        enum:{
            values: ['Pending', 'In Progress', 'Complete'],
            message: '{VALUE} is not a valid status'
        },
        default: "Pending"
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employees"
    }],
    Completion_Date: {
        type: Date
    }

},{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model("Milestones", milestoneSchema);
