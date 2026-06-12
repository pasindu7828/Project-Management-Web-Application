import Announcement from "../models/Announcement.js";
import Notification from "../models/Notification.js";

export const autoDeleteExpiredAnnouncements = async () => {
  const now = new Date();

  try {
    // 1. Find expired announcements
    const expiredAnnouncements = await Announcement.find({
      neverExpire: false,
      endDate: { $lt: now },
    }).select("announcementId");

    if (expiredAnnouncements.length === 0) return;

    const expiredAnnouncementIds = expiredAnnouncements.map(
      (a) => a.announcementId
    );

    // 2. Delete expired announcements
    const deletedAnnouncementsResult = await Announcement.deleteMany({
      announcementId: { $in: expiredAnnouncementIds },
    });
    // 3. Delete related notifications
    const deletedNotificationsResult = await Notification.deleteMany({
      announcementId: { $in: expiredAnnouncementIds },
    });

    if (deletedAnnouncementsResult.deletedCount > 0) {
      console.log(
        `Auto-deleted ${deletedAnnouncementsResult.deletedCount} expired announcements`
      );
    }
    if (deletedNotificationsResult.deletedCount > 0) {
      console.log(
        `Auto-deleted ${deletedNotificationsResult.deletedCount} related notifications`
      );
    }
  } catch (error) {
    console.error("Expiry cleanup failed:", error.message);
  }
};
