import multer from "multer";
import path from "path";
import fs from "fs";

const DEFAULT_ALLOWED = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

function safeFileName(originalname) {
  const ext = path.extname(originalname);
  const base = path.basename(originalname, ext).replace(/\s+/g, "-");
  return { base, ext };
}

/**
 * Reusable multer uploader
 * @param {Object} options
 * @param {(req)=>string} options.getDestination - returns folder path (e.g. "uploads/projects/123")
 * @param {string[]} options.allowedMimeTypes
 * @param {number} options.maxFileSizeMB
 */
export function createDiskUploader({
  getDestination,
  allowedMimeTypes = DEFAULT_ALLOWED,
  maxFileSizeMB = 10,
} = {}) {
  if (!getDestination) {
    throw new Error("createDiskUploader requires getDestination(req) function");
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const dest = getDestination(req);
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      const { base, ext } = safeFileName(file.originalname);
      cb(null, `${base}-${Date.now()}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only PDF and images are allowed."), false);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxFileSizeMB * 1024 * 1024 },
  });
}