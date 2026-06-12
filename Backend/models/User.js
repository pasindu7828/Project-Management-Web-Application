import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
    email: { 
        type: String, 
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
    },
    attachments: [
        {
            type: String
        }
    ],
    role: { 
        type: Number, 
        enum: {
            values: [1, 2, 3],
            message: "Role must be 1 (Employee), 2 (Manager), or 3 (Admin)"
        },
        default: 1
    },
    password: { 
        type: String, 
        minlength: [6, "Password must be at least 6 characters"]
    },
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field for userid (maps to _id)
userSchema.virtual('userid').get(function() {
    return this._id;
});

export default mongoose.model("User", userSchema);
