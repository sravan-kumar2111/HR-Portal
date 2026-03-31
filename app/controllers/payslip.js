
const Salary = require("../models/Salary");
const Payslip = require("../models/Playslip");
const mongoose = require("mongoose");

exports.getPayslipsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params; // now this is ObjectId

    // ---------------------------
    // 1️⃣ Validate ObjectId
    // ---------------------------
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID"
      });
    }

    // ---------------------------
    // 2️⃣ Find salary by ObjectId
    // ---------------------------
    const employee = await Salary.findOne({ employeeId })
      .populate({
        path: "payslips",
        select: "month year amountCredited",
        options: { sort: { year: -1, month: -1 } }
      });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee salary not found"
      });
    }

    // ---------------------------
    // 3️⃣ Format payslips
    // ---------------------------
    const formattedPayslips = employee.payslips.map(ps => ({
      month: ps.month,
      year: ps.year,
      amountCredited: ps.amountCredited
    }));

    // ---------------------------
    // 4️⃣ Response
    // ---------------------------
    res.status(200).json({
      success: true,
      employee: {
        _id: employee.employeeId, // ObjectId
        name: employee.name,
        email: employee.email,
        department: employee.department,
        baseSalary: employee.baseSalary,
        payslips: formattedPayslips
      }
    });

  } catch (err) {
    console.error("Get Employee Payslips Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message
    });
  }
};
// Get Payslip by _id
exports.getPayslipById = async (req, res) => {
  try {
    const { payslipId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(payslipId))
      return res.status(400).json({ success: false, message: "Invalid payslip ID" });

    const payslip = await Payslip.findById(payslipId);
    if (!payslip) return res.status(404).json({ success: false, message: "Payslip not found" });

    res.status(200).json({ success: true, payslip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};
// ---------------------------
// Get ALL Payslips (Admin)
// ---------------------------
exports.getAllPayslips = async (req, res) => {
  try {
    const payslips = await Payslip.find()
      .populate({
        path: "employeeId", // reference to Salary/User
        select: "employeeId name email department baseSalary"
      })
      .sort({ year: -1, month: -1 });

    if (!payslips || payslips.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No payslips found"
      });
    }

    // Format response
    const formattedPayslips = payslips.map(ps => ({
      _id: ps._id,
      month: ps.month,
      year: ps.year,
      amountCredited: ps.amountCredited,
      employee: {
        employeeId: ps.employeeId?.employeeId,
        name: ps.employeeId?.name,
        email: ps.employeeId?.email,
        department: ps.employeeId?.department,
        baseSalary: ps.employeeId?.baseSalary
      }
    }));

    res.status(200).json({
      success: true,
      count: formattedPayslips.length,
      payslips: formattedPayslips
    });

  } catch (err) {
    console.error("Get All Payslips Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message
    });
  }
};