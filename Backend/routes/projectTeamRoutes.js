import express from "express";
import {
    addMember,
    getMembers,
    updateMemberRole,
    removeMember,
    getProjectsOfUser,
    getAllUsers
} from "../controllers/projectTeamController.js";

import { requiredSignIn } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// TEST ROUTE
router.get("/", (req, res) => {
    res.send("Project Team API Working");
});

// Add member
router.post("/addMember", requiredSignIn, addMember);

// Update member role
router.put("/updateMemberRole", requiredSignIn, updateMemberRole);

// Remove member
router.delete("/removeMember", requiredSignIn, removeMember);

// Get team members
router.get("/getMembers/:pid", requiredSignIn, getMembers);

// Get projects of a user
router.get("/getProjects/:uid", requiredSignIn, getProjectsOfUser);

// Get all users for dropdown
router.get("/all", requiredSignIn, getAllUsers);

export default router;
