import EmployeeModel from "../models/EmployeeModel.js";
import User from "../models/User.js";
import { hashPassword, comparePassword } from "../helpers/AuthHelper.js";
import JWT from "jsonwebtoken";
import mongoose from "mongoose";

export const rejisterEmployee = async (req, res) => {
  try {
    console.log('awa');
    console.log(req.params)
    const { id } = req.params;
    console.log(id)

    // get user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // prevent duplicates (choose one depending on your Employee schema)
    // const exists = await EmployeeModel.findOne({ userId: user._id });
    // OR if you don't have userId in Employee schema:
    const exists = await EmployeeModel.findOne({ email: user.email });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "This user is already registered as an employee",
      });
    }

    // NIC as password (hashed)
    const hashed = await hashPassword(user.NIC);

    // create employee
    const employee = await EmployeeModel.create({
      userId: user._id, // recommended to keep link
      FirstName: user.FirstName,
      LastName: user.LastName,
      NIC: user.NIC,
      ContactNumber: user.ContactNumber,
      Gender: user.Gender,
      email: user.email,
      password: hashed,
    });

    await User.findByIdAndDelete(id);

    return res.status(201).json({
      success: true,
      message: "New Employee added successfully",
    });
  } catch (error) {
    console.log("registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server side error",
      error: error.message,
    });
  }
};

//get all workers
export const getAllEmployee = async(req, res) => {
    try {
        const Employees = await EmployeeModel.find()

        res.status(200).json({
            success: true,
            message: "Fetching all employees",
            Employees
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Side Error"
        })
    }
}

//get all workers by role 
export const EmloyeesByRole = async (req, res) => {
    try {
        const Employees = await EmployeeModel.find({role : 1});

        res.status(200).json({
            success: true,
            message: "Fetch all members",
            Employees
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server side Error'
        })
    }
}



//get single employee
export const getSingleEmployee = async (req, res) => {
  try {
    const id = req.user.userid;

    const user = await EmployeeModel.findById(id);

    res.status(200).json({
      success: true,
      message: 'User details fetch successfully!',
      user
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server side Error'
    })
  }
}

//get single employee by ID
export const getSingleEmployeeByID = async (req, res) => {
  try {
    const {id} = req.params;

    const user = await EmployeeModel.findById(id);

    res.status(200).json({
      success: true,
      message: 'User details fetch successfully!',
      user
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server side Error'
    })
  }
}

// LOGIN USER
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Check if user exists
        const user = await EmployeeModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check password
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Generate JWT
        const token = JWT.sign(
            { 
                userid: user._id,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie('access_token', token, {
            httpOnly: true,
            secure: true,          // ✅ required in HTTPS (Render + Vercel)
            sameSite: "none",      // ✅ required for cross-site cookies
            maxAge: 7 * 24 * 60 * 60 * 1000, // ✅ 7 days
        }).status(200).json({
            success: true,
            message: "Login successful",
            data: {
                userid: user._id,
                name: user.name,
                role: user.role,
                email: user.email,
                departmentID: user.departmentID
            },
            token
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Error logging in",
            error: error.message
        });
    }
};

//log out controller
export const SignOut = async(req, res) => {
  try {
    res.clearCookie('access_token').status(200).json({
      success: true,
      message: 'Signout Successfully!'
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Server side Error.'
    })
  }
}

//remove employee
export const RemoveEmployee = async (req, res) => {
  try {
    const {id} = req.params;

    const existUser = await EmployeeModel.findById(id);
    if(!existUser){
      res.status(404).json({
        success: false, 
        message: 'User not found or User already removed'
      })
    }

    await EmployeeModel.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Employee removed successfully.'
    })

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Server side Error.'
    })
  }
}

//update employee deatils
//add department and employee ID for emolyee database
export const updateEmployee = async (req, res) => {
  try {
    const {id} = req.params;
    const { EmployeeID, role, departmentID } = req.body;

    if(!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    const updateEmployee = {};
    if(EmployeeID !== undefined ) updateEmployee.EmployeeID = EmployeeID;
    if(role !== undefined) updateEmployee.role = role;
    if(departmentID !== undefined) updateEmployee.departmentID = departmentID;

    if(Object.keys(updateEmployee).length === 0){
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const update = await EmployeeModel.findByIdAndUpdate(
      id,
      {$set: updateEmployee},
      {
        new: true,
        runValidators: true
      }
    )

    if(!update) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: update
    })


  } catch (error) {
    console.log(error)

    // Duplicate EmployeeID error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "EmployeeID already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server side Error.'
    })
  }
}
