const User = require("../models/user");
const Department = require("../models/Department");
const Attendance = require("../models/Attendance");
const bcrypt = require("bcryptjs");

// 🚀 CREATE HR
exports.createHR = async (req, res) => {
  try {
    const { name, email, empId, departmentId, phone, gender, designation, dateOfJoining } = req.body;

    // 1️⃣ Check required fields
    if (!name || !email || !empId || !departmentId) {
      return res.status(400).json({
        success: false,
        message: "Name, Email, EmpId, and DepartmentId are required",
      });
    }

    // 2️⃣ Validate empId format (3-4 letters + 4 digits)
    const empIdRegex = /^[A-Z]{3,4}\d{4}$/;
    if (!empIdRegex.test(empId.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Employee ID must be 3-4 letters followed by 4 digits (e.g., HRM1001)",
      });
    }

    // 3️⃣ Check if email or empId already exists
    const existingUser = await User.findOne({ $or: [{ email }, { empId: empId.toUpperCase().trim() }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email or Employee ID already exists",
      });
    }

    // 4️⃣ Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // 5️⃣ Generate temporary password
    const tempPassword = "Hr@12345";
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 6️⃣ Create HR user
    const hrUser = new User({
      name,
      email,
      empId: empId.toUpperCase().trim(),
      password: hashedPassword,
      role: "hr",
      department: department._id,
      phone,
      gender,
      designation,
      dateOfJoining,
      firstLogin: true,
    });

    await hrUser.save();

    // 7️⃣ Increment department employee count
    await Department.findByIdAndUpdate(department._id, { $inc: { employeeCount: 1 } });

    // 8️⃣ Send response with temporary password
    res.status(201).json({
      success: true,
      message: "HR created successfully",
      temporaryPassword: tempPassword,
      hr: {
        id: hrUser._id,
        name: hrUser.name,
        email: hrUser.email,
        empId: hrUser.empId,
        department: hrUser.department,
        role: hrUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};