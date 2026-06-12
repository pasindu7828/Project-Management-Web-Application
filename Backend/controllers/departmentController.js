import Department from "../models/DepartmentModel.js";
import Employees from "../models/EmployeeModel.js";
import mongoose from "mongoose";

// Create Department
export const createDepartment = async (req, res) => {
  try {
    const {
      name,
      departmentCode,
      departmentHead,
      capacity,
      status,
      location,
      email,
      number,
      description,
    } = req.body;

    // Validate name
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    // Check if department name already exists
    const existingDeptName = await Department.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existingDeptName) {
      return res.status(400).json({
        success: false,
        message: "Department name already exists",
      });
    }

    // Validate code
    if (!departmentCode || departmentCode.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Department code is required",
      });
    }

    // Check if department code already exists
    const existingDeptCode = await Department.findOne({
      departmentCode: { $regex: new RegExp(`^${departmentCode}$`, "i") },
    });
    if (existingDeptCode) {
      return res.status(400).json({
        success: false,
        message: "Department code already exists",
      });
    }

    // Validate department head (now by name instead of ID, but allow empty)
    let employeeId = undefined;
    if (departmentHead !== undefined) {
      if (!departmentHead || departmentHead.trim() === "") {
        employeeId = null;
      } else {
        const employee = await Employees.findOne({
          name: { $regex: new RegExp(`^${departmentHead.trim()}$`, "i") },
        });

        if (!employee) {
          return res.status(400).json({
            success: false,
            message: "User with this name not found",
          });
        }

        employeeId = employee._id;

        // Check if employee is already a department head
        const existingHead = await Department.findOne({
          departmentHead: employeeId,
        });
        if (existingHead) {
          return res.status(400).json({
            success: false,
            message: "This employee is already assigned as a department head",
          });
        }
      }
    }

    // Validate Capacity
    if (!capacity || isNaN(capacity) || capacity < 1 || capacity > 1000) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be a number between 1 and 1000",
      });
    }

    // Validate status
    const validStatuses = ["Active", "Inactive"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Active' or 'Inactive'",
      });
    }

    // Validate location
    if (!location || location.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Location is required",
      });
    }

    // Validate email
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required",
      });
    }

    // Check email uniqueness
    const existingEmail = await Department.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Validate contact number
    const phoneRegex =
      /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    if (!number || number.trim() === "" || !phoneRegex.test(number)) {
      return res.status(400).json({
        success: false,
        message: "Contact number is required and must be valid",
      });
    }

    // Validate description
    if (description && description.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 500 characters",
      });
    }

    // Create new department
    const department = new Department({
      name: name.trim(),
      departmentCode: departmentCode.trim(),
      departmentHead: employeeId,
      capacity,
      status: status || "Active",
      location: location.trim(),
      email: email.trim().toLowerCase(),
      conactNumber: number.trim(),
      description: description ? description.trim() : "",
    });

    await department.save();
    await department.populate("departmentHead", "name email role");

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({
      success: false,
      message: "Error creating department",
      error: error.message,
    });
  }
};

// Update Department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      departmentCode,
      departmentHead,
      capacity,
      status,
      location,
      email,
      number,
      description,
    } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    // Check if department exists
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Department name cannot be empty",
        });
      }

      if (name.trim().toLowerCase() !== department.name.toLowerCase()) {
        const existingDeptName = await Department.findOne({
          name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
          _id: { $ne: id },
        });
        if (existingDeptName) {
          return res.status(400).json({
            success: false,
            message: "Department name already exists",
          });
        }
      }
    }

    // Validate department code if provided
    if (departmentCode !== undefined) {
      if (!departmentCode || departmentCode.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Department code cannot be empty",
        });
      }

      if (
        departmentCode.trim().toLowerCase() !==
        department.departmentCode.toLowerCase()
      ) {
        const existingDeptCode = await Department.findOne({
          departmentCode: {
            $regex: new RegExp(`^${departmentCode.trim()}$`, "i"),
          },
          _id: { $ne: id },
        });
        if (existingDeptCode) {
          return res.status(400).json({
            success: false,
            message: "Department code already exists",
          });
        }
      }
    }

    // Validate department head if provided
    let employeeId = undefined;
    if (departmentHead !== undefined) {
      if (!departmentHead || departmentHead.trim() === "") {
        employeeId = null;
      } else {
        const employee = await Employees.findOne({
          name: { $regex: new RegExp(`^${departmentHead.trim()}$`, "i") },
        });

        if (!employee) {
          return res.status(400).json({
            success: false,
            message: "User with this name not found",
          });
        }

        employeeId = employee._id;

        const existingHead = await Department.findOne({
          departmentHead: employeeId,
          _id: { $ne: id },
        });
        if (existingHead) {
          return res.status(400).json({
            success: false,
            message: "This employee is already assigned as a department head",
          });
        }
      }
    }

    // Validate capacity if provided
    if (capacity !== undefined) {
      if (isNaN(capacity) || capacity < 1 || capacity > 1000) {
        return res.status(400).json({
          success: false,
          message: "Capacity must be a number between 1 and 1000",
        });
      }
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ["Active", "Inactive"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be either 'Active' or 'Inactive'",
        });
      }
    }

    // Validate location if provided
    if (location !== undefined) {
      if (!location || location.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Location cannot be empty",
        });
      }
    }

    // Validate email if provided
    if (email !== undefined) {
      if (!email || email.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "A valid email address is required",
        });
      }

      if (email.trim().toLowerCase() !== department.email.toLowerCase()) {
        const existingEmail = await Department.findOne({
          email: { $regex: new RegExp(`^${email.trim()}$`, "i") },
          _id: { $ne: id },
        });
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }
      }
    }

    // Validate contact number if provided
    if (number !== undefined) {
      if (!number || number.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Contact number cannot be empty",
        });
      }

      const phoneRegex =
        /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(number)) {
        return res.status(400).json({
          success: false,
          message: "Contact number must be valid",
        });
      }
    }

    // Validate description if provided
    if (description !== undefined && description.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 500 characters",
      });
    }

    // Update department fields
    if (name !== undefined) department.name = name.trim();
    if (departmentCode !== undefined)
      department.departmentCode = departmentCode.trim();
    if (employeeId !== undefined) department.departmentHead = employeeId;
    if (capacity !== undefined) department.capacity = capacity;
    if (status !== undefined) department.status = status;
    if (location !== undefined) department.location = location.trim();
    if (email !== undefined) department.email = email.trim().toLowerCase();
    if (number !== undefined) department.conactNumber = number.trim();
    if (description !== undefined) department.description = description.trim();

    await department.save();
    await department.populate("departmentHead", "name email role");

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({
      success: false,
      message: "Error updating department",
      error: error.message,
    });
  }
};

// Delete Department
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Check if any users are assigned to this department
    const employeeCount = await Employees.countDocuments({ departmentID: id });

    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department with ${employeeCount} assigned employee(s). Please reassign or remove employees first.`,
      });
    }

    await Department.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting department",
      error: error.message,
    });
  }
};

// Get All Departments
export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate("departmentHead", "name email role")
      .sort({ createdAt: -1 });

    // Get employee count for each department
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await Employees.countDocuments({
          departmentID: dept._id,
        });
        return {
          ...dept.toObject(),
          employeeCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Departments retrieved successfully",
      count: departments.length,
      data: departmentsWithCount,
    });
  } catch (error) {
    console.error("Error retrieving departments:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving departments",
      error: error.message,
    });
  }
};

// Get Single Department
export const getDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    const department = await Department.findById(id).populate(
      "departmentHead",
      "name email role"
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Get employee count for this department
    const employeeCount = await Employees.countDocuments({ departmentID: id });

    // Get list of employees in this department
    const employees = await Employees.find({ departmentID: id }).select(
      "name email role"
    );

    res.status(200).json({
      success: true,
      message: "Department retrieved successfully",
      data: {
        ...department.toObject(),
        employeeCount,
        employees,
      },
    });
  } catch (error) {
    console.error("Error retrieving department:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving department",
      error: error.message,
    });
  }
};

// Change Department Status
export const changeDepartmentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Toggle status
    department.status = department.status === "Active" ? "Inactive" : "Active";
    await department.save();

    await department.populate("departmentHead", "name email role");

    res.status(200).json({
      success: true,
      message: `Department status changed to ${department.status}`,
      data: department,
    });
  } catch (error) {
    console.error("Error changing department status:", error);
    res.status(500).json({
      success: false,
      message: "Error changing department status",
      error: error.message,
    });
  }
};

// Get Active Departments Only
export const getActiveDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ status: "Active" })
      .populate("departmentHead", "name email role")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: "Active departments retrieved successfully",
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    console.error("Error retrieving active departments:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving active departments",
      error: error.message,
    });
  }
};

// Search Departments
export const searchDepartments = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const departments = await Department.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { departmentCode: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
      ],
    })
      .populate("departmentHead", "name email role")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: "Search completed successfully",
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    console.error("Error searching departments:", error);
    res.status(500).json({
      success: false,
      message: "Error searching departments",
      error: error.message,
    });
  }
};

// Get Department Statistics
export const getDepartmentStatistics = async (req, res) => {
  try {
    const totalDepartments = await Department.countDocuments();
    const activeDepartments = await Department.countDocuments({
      status: "Active",
    });
    const inactiveDepartments = await Department.countDocuments({
      status: "Inactive",
    });

    // Get departments with most employees
    const allDepartments = await Department.find();
    const departmentsWithCounts = await Promise.all(
      allDepartments.map(async (dept) => {
        const count = await Employees.countDocuments({
          departmentID: dept._id,
        });
        return {
          id: dept._id,
          name: dept.name,
          employeeCount: count,
          capacity: dept.capacity,
        };
      })
    );

    departmentsWithCounts.sort((a, b) => b.employeeCount - a.employeeCount);

    res.status(200).json({
      success: true,
      message: "Department statistics retrieved successfully",
      data: {
        totalDepartments,
        activeDepartments,
        inactiveDepartments,
        topDepartments: departmentsWithCounts.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Error retrieving department statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving department statistics",
      error: error.message,
    });
  }
};
