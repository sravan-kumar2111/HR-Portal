const mongoose = require("mongoose");
const User = require("../models/user");
const LeaveBalance = require("../models/LeaveBalance");

exports.getEmployeeLeaveBalance = async (req, res) => {
  try {
    // ✅ Get employeeId from body (works for JSON & form-data)
    const employeeId = req.body.employeeId?.trim();

    // ✅ Validate input
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId is required",
      });
    }

    // ✅ Validate Mongo ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employeeId",
      });
    }

    // ✅ Find employee
    const user = await User.findById(employeeId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // ✅ Check if leave balance exists
    let leaveBalance = await LeaveBalance.findOne({ employeeId });

    // ✅ Create if not exists
    if (!leaveBalance) {
      leaveBalance = await LeaveBalance.create({
        employeeId,
        empNumber: user.empNumber || `EMP${Date.now()}`, // fallback safety
        sickLeave: 1,
        casualLeave: 1,
        earnedLeave: 0,
        year: new Date().getFullYear(),
      });
    }

    // ✅ Success response
    return res.status(200).json({
      success: true,
      leaveBalance,
    });

  } catch (error) {
    console.error("❌ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
exports.getEmployeeLeaveBalanceGET = async (req, res) => {
  try {
    // ✅ Get employeeId from query
    const employeeId = req.params.employeeId?.trim();

    // ✅ Validate input
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId is required",
      });
    }

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employeeId",
      });
    }

    // ✅ Find employee
    const user = await User.findById(employeeId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // ✅ Check leave balance
    let leaveBalance = await LeaveBalance.findOne({ employeeId });

    // ✅ Auto-create if not exists
    if (!leaveBalance) {
      leaveBalance = await LeaveBalance.create({
        employeeId,
        empNumber: user.empNumber || `EMP${Date.now()}`,
        sickLeave: 1,
        casualLeave: 1,
        earnedLeave: 0,
        year: new Date().getFullYear(),
      });
    }

    // ✅ Response
    return res.status(200).json({
      success: true,
      leaveBalance,
    });

  } catch (error) {
    console.error("❌ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};