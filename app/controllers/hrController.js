const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.createEmployee = async (req, res) => {

  try {

    const { name, email, department, designation, empId, phone, gender, dateOfBirth, dateOfJoining, address } = req.body;

    // Check duplicate email
    const existingEmployee = await User.findOne({ email });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Employee already exists with this email"
      });
    }

    const tempPassword = "Emp@12345";

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const employee = new User({
      name,
      empId,
      email,
      password: hashedPassword,
      role: "employee",
      department,
      designation,
      empId, 
      phone,
      gender,
      dateOfBirth,
      dateOfJoining,
      address,
      firstLogin: true
    });

    await employee.save();

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      temporaryPassword: tempPassword
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

/////////////////////////
// GET ALL EMPLOYEES
/////////////////////////
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/////////////////////////
// GET SINGLE EMPLOYEE
/////////////////////////
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/////////////////////////
// UPDATE EMPLOYEE
/////////////////////////
exports.updateEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const updatedData = { ...req.body };

    // If password is being updated, hash it
    if (updatedData.password) {
      updatedData.password = await bcrypt.hash(updatedData.password, 10);
    }

    const user = await User.findByIdAndUpdate(employeeId, updatedData, {
      new: true,
      runValidators: true
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.json({
      success: true,
      message: "Employee updated successfully",
      user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/////////////////////////
// DELETE EMPLOYEE
/////////////////////////
exports.deleteEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const user = await User.findByIdAndDelete(employeeId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.json({
      success: true,
      message: "Employee deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};