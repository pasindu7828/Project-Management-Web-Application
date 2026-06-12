import express from 'express';
import { requiredSignIn } from './../middlewares/AuthMiddleware.js';
import { addProjectAttachmentController, getAllProjectAttachmentsController,streamProjectAttachmentController, deleteProjectAttachmentController } from '../controllers/projectAttachmentController.js';
import { createDiskUploader } from '../middlewares/uploadFactory.js';

const router = express.Router({ mergeParams: true });

// store per project folder
const uploader = createDiskUploader({
  getDestination: (req) => `uploads/projects/${req.params.projectId}`,
  maxFileSizeMB: 10,
});

// UPLOAD ATTACHMENT TO PROJECT -> POST /api/v1/projects/:projectId/attachments
router.post("/", requiredSignIn, uploader.array("attachments", 5), addProjectAttachmentController);

// STREAM ONE ATTACHMENT FILE -> GET /api/v1/projects/:projectId/attachments/file/:attachmentId
router.get("/file/:attachmentId", requiredSignIn, streamProjectAttachmentController);

// GET ALL ATTACHMENTS (MongoDB metadata) for a project
router.get("/", requiredSignIn, getAllProjectAttachmentsController);

// DELETE ONE ATTACHMENT (DB + file) -> DELETE /api/v1/projects/:projectId/attachments/:attachmentId
router.delete("/:attachmentId", requiredSignIn, deleteProjectAttachmentController);

export default router;