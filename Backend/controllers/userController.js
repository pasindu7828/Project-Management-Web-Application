import User from "../models/User.js";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";

// REGISTER USER
// REGISTER USER
export const registerUser = async (req, res) => {
    try {
        const { FirstName, LastName, NIC, ContactNumber, Gender, email } = req.body;

        // Validation
        if (!FirstName || !NIC || !ContactNumber || !LastName || !Gender || !email ) {
            return res.status(404).json({
                success: false,
                message: "All fields are required!"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "You already send your details"
            });
        }

        const attachments =[];
        if (req.file) {
            attachments.push(req.file.path.replace(/\\/g, "/"));
        }

        // Create user
        const user = await User.create({ FirstName, LastName, NIC, ContactNumber, Gender, email, attachments});

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: { 
                userid: user._id,
                FirstName: user.FirstName,
                LastName: user.LastName,
                email: user.email,
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Error registering user",
            error: error.message
        });
    }
};

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
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
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
            httpOnly: true
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

//get all users
export const getAllUsers = async (req, res) => {
  try {
    // Optional query params:
    // ?page=1&limit=10&search=ravindu&sort=createdAt&order=desc
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const search = (req.query.search || "").trim();

    const sortField = req.query.sort || "createdAt";
    const sortOrder = (req.query.order || "desc").toLowerCase() === "asc" ? 1 : -1;

    const filter = {};
    if (search) {
      filter.$or = [
        { FirstName: { $regex: search, $options: "i" } },
        { LastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { NIC: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-__v") // remove version key
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};


//reject user resume controller
export const removeResume = async (req, res) => {
    try {
        const { id } = req.params;

        const CheckExist = await User.findById(id);
        if(!CheckExist){
            res.status(404).json({
                success: false,
                message: 'This user already rejected.'
            })
        }

        const user = await User.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'User rejected!'
        })
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server side Error.',
            error
        })
    }
}
