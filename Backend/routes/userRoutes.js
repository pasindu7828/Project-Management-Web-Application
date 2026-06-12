import express from "express";
import path from "path";
import { registerUser, loginUser, getAllUsers, removeResume } from "../controllers/userController.js";
import { isAdmin, requiredSignIn } from './../middlewares/AuthMiddleware.js';
import { createDiskUploader } from "../middlewares/uploadFactory.js";


const router = express.Router();

const upload = createDiskUploader({
  getDestination: () => path.join(process.cwd(), "Resumes"),
});

// User Registration - POST /api/v1/userAuth/userRegistration
router.post(  "/userRegistration",upload.single("resume"),registerUser);

// User Login - POST /api/v1/userAuth/userLogin
router.post("/userLogin", loginUser);

//get all users
router.get('/getAllUsers', requiredSignIn, isAdmin, getAllUsers );

//remove user 
router.delete('/removeResume/:id',requiredSignIn, isAdmin, removeResume)




export default router;