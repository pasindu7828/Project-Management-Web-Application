import express from 'express';
import { 
    rejisterEmployee,
    getAllEmployee,
    EmloyeesByRole,
    getSingleEmployee,
    loginUser,
    SignOut,
    RemoveEmployee,
    updateEmployee,
    getSingleEmployeeByID,
 } from '../controllers/Employeecontroller.js';
import { isAdmin, requiredSignIn } from '../middlewares/AuthMiddleware.js';


const router = express.Router();

router.post("/userLogin", loginUser);

//signout function
router.post("/Signout", requiredSignIn, SignOut)

//add new employee route
router.post("/RejisterEmployee/:id", requiredSignIn, isAdmin, rejisterEmployee );

//get all workers
router.get("/getAllEmployee", requiredSignIn, isAdmin, getAllEmployee)

//get all workers by there role
router.get("/getEmloyeesByRole", requiredSignIn, EmloyeesByRole );

//get single user
router.get("/getSingleEmployee",requiredSignIn, getSingleEmployee)

//get single employee by id
router.get("/getSingleEmployeeByID/:id",requiredSignIn, getSingleEmployeeByID)

//remove employee
router.delete("/RemoveEmployee/:id",requiredSignIn, isAdmin, RemoveEmployee)

//update employee, add department, employee id and assign new role
router.patch("/updateEmployee/:id", requiredSignIn, isAdmin, updateEmployee)


export default router;