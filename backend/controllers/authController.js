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

    // 🔑 THE FIX: Create a plain object and remove the password field
    const userWithoutPassword = user.toObject(); // Convert Mongoose document to plain JS object
    delete userWithoutPassword.password; // Remove the sensitive password field

    res.status(201).json({
      id: userWithoutPassword._id,
      user: userWithoutPassword, // <-- Now sending the clean object
      token: generateToken(userWithoutPassword._id),
    });
    
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
};