import mongoose, { model } from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    departmentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    departmentHead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employees",
      default: null,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },
    status: {
      type: String,
      enum: {
        values: ["Active", "Inactive"],
        message: "Status is either active or inactive",
      },
      default: "Active",
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    conactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },

  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
