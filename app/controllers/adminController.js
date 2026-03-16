const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.createHR = async (req, res) => {
  try {

    const { name, email } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "HR already exists with this email"
      });
    }

    // Temporary password
    const tempPassword = "Hr@12345";

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const hr = new User({
      name,
      email,
      password: hashedPassword,
      role: "hr",
      firstLogin: true
    });

    await hr.save();

    res.status(201).json({
      success: true,
      message: "HR created successfully",
      temporaryPassword: tempPassword
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};