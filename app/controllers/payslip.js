// const Payslip = require("../models/Playslip");

// // Get all payslips for a specific employee
// exports.getPayslipsByEmployee = async (req, res) => {
//   try {
//     const { employeeId } = req.params; // employeeId from URL parameter

//     // Fetch all payslips for this employee, latest first
//     const payslips = await Payslip.find({ employeeId })
//                                   .sort({ month: -1 }) // latest month first
//                                   .select("month salary"); // only show month and salary

//     if (!payslips || payslips.length === 0) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "No payslips found for this employee" 
//       });
//     }

//     res.json({ 
//       success: true, 
//       count: payslips.length, // total number of payslips
//       payslips 
//     });
    
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

const Payslip = require("../models/Playslip");
const User= require("../models/user");

exports.getPayslipsByEmployee = async (req, res) => {
  try {
    const employeeId = req.params.employeeId; // or from req.body
    const payslips = await Payslip.find({ employeeId })
      .populate({
        path: "employeeId",
        select: "employeeId name email department baseSalary"
      });

    if (!payslips || payslips.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No payslips found for this employee"
      });
    }

    // Map to send cleaner response
    const formattedPayslips = payslips.map(ps => ({
      _id: ps._id,
      month: ps.month,
      employeeId: ps.employeeId.employeeId,
      name: ps.employeeId.name,
      email: ps.employeeId.email,
      department: ps.employeeId.department,
      baseSalary: ps.employeeId.baseSalary,
      amountCredited: ps.amountCredited
    }));

    res.status(200).json({
      success: true,
      count: formattedPayslips.length,
      payslips: formattedPayslips
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};