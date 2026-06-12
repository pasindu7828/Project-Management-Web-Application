import Announcement from "../models/Announcement.js";
import { v4 as uuidv4 } from "uuid";
import Employees from "../models/EmployeeModel.js"
import Notification from "../models/Notification.js";
import File from "../models/AnnouncemetAttachmet.js";
import fs from "fs";
import path from "path";

// Create Announcements
export async function createAnnouncement(req, res) {
  try {
    const {
      title,
      message,
      startDate,
      endDate,
      priority,
      audience,
      isPinned,
      notifyRoles,
      neverExpire,
    } = req.body;

    const announcementId = uuidv4();
    const attachments = [];

    // Handle multiple files
    if (req.files && req.files.length > 0) {
      for (const fileData of req.files) {
         // Create file object using static method, adding announcementId
         const file = File.fromMulterFile({ ...fileData, announcementId }); 
         await file.save();
         attachments.push(file._id);
      }
    }

    const newAnnouncement = await Announcement.create({
      announcementId,
      title,
      startDate,
      endDate,
      priority,
      audience,
      isPinned,
      message,
      notifyRoles, // ["1", "2","3"]
      neverExpire,
      attachments, // Store array of file IDs
    });

    // NOTIFICATION LOGIC
    if (audience?.length > 0) {
      const roles = audience?.map(Number);

      const users = await Employees.find({ role: { $in: roles } }).select("_id");

      const notifications = users.map((employee) => ({
        user: employee._id,
        title: "New Announcement",
        message: title,
        announcementId: newAnnouncement.announcementId,
      }));

      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: newAnnouncement,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

//Get All Announcements for manager
export async function getManagerAnnouncements(req, res) {
  try {
    const announcements = await Announcement.find({ audience: "2" }).sort(
      { createdAt: -1 }
    );

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
//get announcement for employee
export async function getEmployeeAnnouncements(req, res) {
  try {
    const announcements = await Announcement.find({
      audience: "1",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

//get announcement for admin
export async function getAdminAnnouncements(req, res) {
  try {
    const announcements = await Announcement.find({ audience: "3" }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get All Announcements
export async function getAllAnnouncements(req, res) {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get Announcement by ID
export async function getAnnouncementbyID(req, res) {
  try {
    const AId = req.params;
    const announcement = await Announcement.findOne({ announcementId: AId.id });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get Recent / Active Announcements
export async function getActiveAnnouncements(req, res) {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Update Announcement
export async function updateAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const announcement = await Announcement.findOne({ announcementId: id });
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    const isExpired =
      announcement.endDate && new Date(announcement.endDate) < new Date();

    const removingNeverExpire =
      announcement.neverExpire === true && updateData.neverExpire === false;

    //  instant delete rule
    if (isExpired && removingNeverExpire) {
      await deleteAnnouncementByAnnouncementId(id);

      return res.status(200).json({
        success: true,
        message: "Announcement expired and deleted",
      });
    }

    const updated = await Announcement.findOneAndUpdate(
      { announcementId: id },
      updateData,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Announcement updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Delete Announcement  
//delete announcement releted notification and files

export async function deleteAnnouncement(req, res) 
{
  const { id } = req.params;
    if(!id){
      return res.status(404).json({
        success: false,
        message: "announcement id is required",
      });
    }
   
  try {   
     const deletedAnnouncement = await Announcement.findOne({ announcementId: id });
   
      if (!deletedAnnouncement) {
        return res.status(404).json({
          success: false,
          message: "Announcement not found",
        });
      }
      
      const deletedNotificationsResult = await Notification.deleteMany({ announcementId: id });
        
       if (deletedNotificationsResult.deletedCount > 0) {
      console.log(`Auto-deleted ${deletedNotificationsResult.deletedCount} related notifications`);
    }

    // Delete associated files
    const associatedFiles = await File.find({ announcementId: id });
    for (const file of associatedFiles) {
        
        const filePath = path.resolve(file.path);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            } else {
                console.warn(`[DeleteAnnouncement] File NOT found at path: ${filePath}`);
                
                // Fallback attempt: check 'uploads' folder directly
                const fallbackPath = path.join(process.cwd(), "uploads", path.basename(file.path));
                if (filePath !== fallbackPath && fs.existsSync(fallbackPath)) {
                    console.log(`[DeleteAnnouncement] Found at fallback path: ${fallbackPath}, deleting...`);
                    fs.unlinkSync(fallbackPath);
                }
            }
        } catch (err) {
            console.error(`[DeleteAnnouncement] Error deleting file: ${filePath}`, err);
        }
        //delet main announcement
         await file.deleteOne();
    }
      await deletedAnnouncement.deleteOne();

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

//like announcement
export async function likeAnnouncement(req, res) {
  try {
    const { id } = req.params; // announcementId (UUID)
    const userId = req.user.userid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const announcement = await Announcement.findOne({
      announcementId: id,
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    //Clean bad data
    announcement.likes = announcement.likes.filter((uid) => uid !== null);

    const alreadyLiked = announcement.likes.some(
      (uid) => uid.toString() === userId.toString()
    );

    if (alreadyLiked) {
      announcement.likes = announcement.likes.filter(
        (uid) => uid.toString() !== userId.toString()
      );
    } else {
      announcement.likes.push(userId);
    }

    announcement.likesCount = announcement.likes.length;
    await announcement.save();

    res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      likesCount: announcement.likesCount,
      data: announcement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

//notification
export async function getMyNotifications(req, res) {
  console.log("vvvvvvvv",req.header)
  const notifications = await Notification.find({
    user: req.user.userid,
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: notifications,
  });
}

export async function markAsRead(req, res) {
  try {
    const notification = await Notification.findById(req.params.id);
    if (req.params.id == notification._id) {
    }
    await Notification.findByIdAndUpdate(req.params.id, {
      isRead: true,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}



