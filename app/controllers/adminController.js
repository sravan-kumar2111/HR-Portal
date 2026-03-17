const User = require("../models/user");
const Department = require("../models/Department");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid"); // optional, for generating empId

exports.createHR = async (req, res) => {
  try {
    const { name, email, departmentId, phone, gender, dateOfBirth, address, designation } = req.body;

    // 1️⃣ Check required fields
    if (!name || !email || !departmentId) {
      return res.status(400).json({
        success: false,
        message: "Name, Email and Department are required"
      });
    }

    // 2️⃣ Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "HR already exists with this email"
      });
    }

    // 3️⃣ Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    // 4️⃣ Generate temporary password
    const tempPassword = "Hr@12345";
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 5️⃣ Generate empId
    const empId = "HR-" + uuidv4().slice(0, 8);

    // 6️⃣ Create HR
    const hr = new User({
      name,
      empId,
      email,
      password: hashedPassword,
      role: "hr",
      department: department._id,
      phone,
      gender,
      dateOfBirth,
      address,
      designation,
      firstLogin: true
    });

    await hr.save();

    // Optional: increment department employee count for HR as well
    await Department.findByIdAndUpdate(department._id, { $inc: { employeeCount: 1 } });

    res.status(201).json({
      success: true,
      message: "HR created successfully",
      temporaryPassword: tempPassword,
      hr
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};