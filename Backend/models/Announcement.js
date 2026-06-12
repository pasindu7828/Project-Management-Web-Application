import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    announcementId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: false,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    audience: {
      type: Number,
      enum: [0, 1, 2, 3], // 0 = All
      default: 0,
    },

    // likes
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employees" }],
    likesCount: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Additional Options
    isPinned: {
      type: Boolean,
      default: false,
    },

    //notifications
    notifyRoles: {
      type: [Number], // 1,2,3
      enum: [1, 2, 3],
      default: [],
    },

    neverExpire: {
      type: Boolean,
      default: false,
    },

    attachments: [
      {
        type: String,
        // store File _id
      },
    ],
  },

  {
    timestamps: true,
  }
);

export default mongoose.model("Announcement", announcementSchema);
