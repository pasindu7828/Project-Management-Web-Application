import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    announcementId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to create a File from a multer object
fileSchema.statics.fromMulterFile = function (file) {
  return new this({
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size,
    announcementId: file.announcementId || null,
  });
};

export default mongoose.model("File", fileSchema);
