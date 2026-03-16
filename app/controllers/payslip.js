const Payslip = require("../models/Playslip");

// Get all payslips for a specific employee
exports.getPayslipsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params; // employeeId from URL parameter

    // Fetch all payslips for this employee, latest first
    const payslips = await Payslip.find({ employeeId })
                                  .sort({ month: -1 }) // latest month first
                                  .select("month salary"); // only show month and salary

    if (!payslips || payslips.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No payslips found for this employee" 
      });
    }

    res.json({ 
      success: true, 
      count: payslips.length, // total number of payslips
      payslips 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};