import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema({
    EmployeeID: {
        type: String,
        default: null,
    },
    FirstName: { 
        type: String, 
        required: true,
        trim: true
    },
    LastName: { 
        type: String, 
        required: true,
        trim: true
    },
    NIC: {
        type: String,
        required: true
    },
    ContactNumber: {
        type: Number,
        required: true
    },
    Gender: {
        type: String,
        required: true
    },
    role: { 
        type: Number, 
        enum: {
            values: [1, 2, 3],
            message: "Role must be 1 (Employee), 2 (Manager), or 3 (Admin)"
        },
        default: 1
    },
    email: { 
        type: String, 
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
    },
    password: { 
        type: String, 
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"]
    },
    departmentID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Department",
    }
},{timestamps: true});

export default mongoose.model("Employees",EmployeeSchema);