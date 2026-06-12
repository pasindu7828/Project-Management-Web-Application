

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employees",
      required: true,
    },

    title: String,
    message: String,

    type: {
      type: String,
      default: "ANNOUNCEMENT",
    },

    announcementId: String,

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
