const User = require("../models/user");
const bcrypt = require("bcryptjs");
const Department = require("../models/Department");
/////////////////////////
// CREATE EMPLOYEE
/////////////////////////
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, departmentId, designation, empId, phone, gender, dateOfBirth, dateOfJoining, address } = req.body;

    // 1️⃣ Validate required fields
    if (!name || !email || !empId || !departmentId) {
      return res.status(400).json({
        success: false,
        message: "Name, Email, EmpId and Department are required"
      });
    }

    // 2️⃣ Check duplicate email or empId
    const existingEmployee = await User.findOne({ $or: [{ email }, { empId }] });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Employee already exists with this email or empId"
      });
    }

    // 3️⃣ Check department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    // 4️⃣ Generate temporary password
    const tempPassword = "Emp@12345";
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 5️⃣ Create employee
    const employee = new User({
      name,
      empId,
      email,
      password: hashedPassword,
      role: "employee",
      department: department._id, // store ObjectId
      designation,
      phone,
      gender,
      dateOfBirth,
      dateOfJoining,
      address,
      firstLogin: true
    });

    await employee.save();

    // 6️⃣ Increment department employee count
    await Department.findByIdAndUpdate(department._id, { $inc: { employeeCount: 1 } });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      temporaryPassword: tempPassword,
      employee
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
// exports.deleteEmployee = async (req, res) => {
//   try {
//     const employeeId = req.params.id;

//     const user = await User.findByIdAndDelete(employeeId);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found"
//       });
//     }

//     res.json({
//       success: true,
//       message: "Employee deleted successfully"
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Delete the employee
    await User.findByIdAndDelete(req.params.id);

    // Decrement employeeCount in the department
    if (employee.department) {
      await Department.findByIdAndUpdate(
        employee.department,
        { $inc: { employeeCount: -1 } }
      );
    }

    res.status(200).json({
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