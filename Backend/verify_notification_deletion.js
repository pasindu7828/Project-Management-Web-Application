import mongoose from "mongoose";
import Announcement from "./models/Announcement.js";
import Notification from "./models/Notification.js";
import { autoDeleteExpiredAnnouncements } from "./middlewares/announcementExpirymiddleware.js";
import dotenv from "dotenv";

dotenv.config();

const runVerification = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to DB");

    // Create dummy expired announcement
    const announcement = await Announcement.create({
      title: "Test Expired Announcement",
      message: "Test",
      announcementId: "test-announcement-" + Date.now(),
      endDate: new Date(Date.now() - 100000), // Expired
      user: new mongoose.Types.ObjectId(), // detailed schema check skipped for brevity, assumed optional or mocked if required
      neverExpire: false,
    });
    console.log("Created expired announcement:", announcement._id);

    // Create dummy notification
    const notification = await Notification.create({
      user: new mongoose.Types.ObjectId(),
      title: "Test Notification",
      message: "Test",
      announcementId: announcement._id.toString(),
    });
    console.log("Created related notification:", notification._id);

    // Run middleware
    await autoDeleteExpiredAnnouncements();

    // Verify deletion
    const aCheck = await Announcement.findById(announcement._id);
    const nCheck = await Notification.findById(notification._id);

    if (!aCheck && !nCheck) {
      console.log("SUCCESS: Both announcement and notification were deleted.");
    } else {
      console.error("FAILURE:", {
        announcementExists: !!aCheck,
        notificationExists: !!nCheck,
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Verification failed:", error);
    await mongoose.disconnect();
  }
};

runVerification();
