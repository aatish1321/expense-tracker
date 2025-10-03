const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (id) => {
  // Use the process.env.JWT_SECRET (ensure it is loaded via dotenv)
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Register User
exports.registerUser = async (req, res) => {
  const { fullName, email, password, profileImageUrl } = req.body;

  // Validation: Check for missing fields
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Create the user
    const user = await User.create({
      fullName,
      email,
      password,
      profileImageUrl,
    });

    // 🔑 THE FIX: Create a plain object and remove the password field from the RESPONSE ONLY.
    const userWithoutPassword = user.toObject(); // Convert Mongoose document to plain JS object
    delete userWithoutPassword.password; // Remove the sensitive password field

    res.status(201).json({
      // Use the original 'user._id' for the ID field and token generation
      id: user._id, 
      user: userWithoutPassword, // <-- Send the clean object here
      token: generateToken(user._id), // <-- Use the original ID for JWT generation
    });
    
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔑 THE FIX: Create a plain object and remove the password field from the RESPONSE ONLY.
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(200).json({
      // Use the original 'user._id' for the ID field and token generation
      id: user._id,
      user: userWithoutPassword, // <-- Send the clean object here
      token: generateToken(user._id), // <-- Use the original ID for JWT generation
    });
    
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error logging in user", error: err.message });
  }
};

// Get User Info
exports.getUserInfo = async (req, res) => {
  try {
    // This function was already correct because .select("-password") handles the exclusion!
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user info" });
  }
};