// // const Payslip = require("../models/Playslip");

// // // Get all payslips for a specific employee
// // exports.getPayslipsByEmployee = async (req, res) => {
// //   try {
// //     const { employeeId } = req.params; // employeeId from URL parameter

// //     // Fetch all payslips for this employee, latest first
// //     const payslips = await Payslip.find({ employeeId })
// //                                   .sort({ month: -1 }) // latest month first
// //                                   .select("month salary"); // only show month and salary

// //     if (!payslips || payslips.length === 0) {
// //       return res.status(404).json({ 
// //         success: false, 
// //         message: "No payslips found for this employee" 
// //       });
// //     }

// //     res.json({ 
// //       success: true, 
// //       count: payslips.length, // total number of payslips
// //       payslips 
// //     });
    
// //   } catch (error) {
// //     res.status(500).json({ 
// //       success: false, 
// //       message: "Server error", 
// //       error: error.message 
// //     });
// //   }
// // };

// const Payslip = require("../models/Playslip");
// const User= require("../models/user");

// exports.getPayslipsByEmployee = async (req, res) => {
//   try {
//     const employeeId = req.params.employeeId; // or from req.body
//     const payslips = await Payslip.find({ employeeId })
//       .populate({
//         path: "employeeId",
//         select: "employeeId name email department baseSalary"
//       });

//     if (!payslips || payslips.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No payslips found for this employee"
//       });
//     }

//     // Map to send cleaner response
//     const formattedPayslips = payslips.map(ps => ({
//       _id: ps._id,
//       month: ps.month,
//       employeeId: ps.employeeId.employeeId,
//       name: ps.employeeId.name,
//       email: ps.employeeId.email,
//       department: ps.employeeId.department,
//       baseSalary: ps.employeeId.baseSalary,
//       amountCredited: ps.amountCredited
//     }));

//     res.status(200).json({
//       success: true,
//       count: formattedPayslips.length,
//       payslips: formattedPayslips
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };
const Salary = require("../models/Salary");
const Payslip = require("../models/Playslip");
const mongoose = require("mongoose");


exports.getPayslipsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params; // e.g., "MCT1006"

    // Step 1: Find the employee by custom employeeId
    const employee = await Salary.findOne({ employeeId }).populate({
      path: "payslips",
      select: "month year amountCredited",
      options: { sort: { year: -1, month: -1 } } // latest first
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Step 2: Format payslips
    const formattedPayslips = employee.payslips.map(ps => ({
      month: ps.month,
      year: ps.year,
      amountCredited: ps.amountCredited
    }));

    // Step 3: Send combined response
    res.status(200).json({
      success: true,
      employee: {
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        baseSalary: employee.baseSalary,
        payslips: formattedPayslips
      }
    });

  } catch (err) {
    console.error("Get Employee Payslips Error:", err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
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