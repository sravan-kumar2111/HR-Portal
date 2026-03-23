const Salary = require("../models/Salary");
const Payslip = require("../models/Playslip");
const path = require("path");
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose"); 
const cron = require("node-cron");
const User = require("../models/user");

/**
 * 1️⃣ Add Employee with Base Salary
 */
exports.addEmployee = async (req, res) => {
  try {
    const { employeeId, name, email, department, baseSalary } = req.body;

    // Validate employeeId
    if (!employeeId || typeof employeeId !== "string") {
      return res.status(400).json({ message: "Employee ID is required and must be a string" });
    }

   const pattern = /^[A-Z]{3}\d{4}$/;
    if (!pattern.test(employeeId)) {
      return res.status(400).json({ message: "Employee ID must be in format EMP001, EMP002, etc." });
    }

    // Check duplicates
    const existing = await Salary.findOne({ $or: [{ employeeId }, { email }] });
    if (existing) {
      return res.status(400).json({ message: "Employee ID or Email already exists" });
    }

    // Create employee
    const employee = await Salary.create({
      employeeId,
      name,
      email,
      department,
      baseSalary,
      payslips: []
    });

    // Create first month payslip
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    const payslip = await Payslip.create({
      employeeId: employee._id,
      month: currentMonth,
      year: currentYear,
      amountCredited: baseSalary
    });

    employee.payslips.push(payslip._id);
    await employee.save();

    res.status(201).json({
      success: true,
      message: "Employee added with base salary",
      employee,
      firstPayslip: payslip
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * 2️⃣ Increment Salaries (with validation)
 * Accepts raw JSON or x-www-form-urlencoded
 */
exports.incrementSalaries = async (req, res) => {
  try {
    let items = [];

    // Check if JSON array
    if (Array.isArray(req.body)) {
      items = req.body;
    } else if (req.body.employeeIds && req.body.increments) {
      // x-www-form-urlencoded fallback
      const employeeIds = req.body.employeeIds.split(",");
      const increments = req.body.increments.split(",").map(Number);
      items = employeeIds.map((id, index) => ({
        employeeId: id.trim(),
        increment: increments[index] || 0
      }));
    } else {
      return res.status(400).json({ message: "Invalid request body" });
    }

    // Get all valid employeeIds for reference
    const allEmployees = await Salary.find({}, "employeeId");
    const validIds = allEmployees.map(emp => emp.employeeId);

    const results = [];

    for (const item of items) {
      const { employeeId, increment } = item;

      // Check if employee exists
      const employee = await Salary.findOne({ employeeId });
      if (!employee) {
        results.push({
          employeeId,
          success: false,
          message: "Employee not found",
          validEmployeeIds: validIds
        });
        continue;
      }

      // Increment base salary
      employee.baseSalary += increment;
      await employee.save();

      // Update or create current month payslip
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();

      let payslip = await Payslip.findOne({ employeeId: employee._id, month: currentMonth, year: currentYear });
      if (!payslip) {
        payslip = await Payslip.create({
          employeeId: employee._id,
          month: currentMonth,
          year: currentYear,
          amountCredited: employee.baseSalary
        });
        employee.payslips.push(payslip._id);
        await employee.save();
      } else {
        payslip.amountCredited = employee.baseSalary;
        await payslip.save();
      }

      results.push({
        employeeId,
        success: true,
        newBaseSalary: employee.baseSalary
      });
    }

    res.status(200).json({ success: true, results });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
/**
 * 3️⃣ Download Payslip as PDF
 */
exports.downloadPayslip = async (req, res) => {
  try {
    const { payslipId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(payslipId)) {
      return res.status(400).json({ message: "Invalid payslip ID" });
    }

    const payslip = await Payslip.findById(payslipId)
      .populate("employeeId", "name email department");

    if (!payslip) return res.status(404).json({ message: "Payslip not found" });

    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${payslip.employeeId.name}-${payslip.month}-${payslip.year}.pdf`
    );

    doc.pipe(res);  // pipe BEFORE end
    doc.text(`Payslip for ${payslip.employeeId.name}`);
    doc.text(`Email: ${payslip.employeeId.email}`);
    doc.text(`Department: ${payslip.employeeId.department}`);
    doc.text(`Month/Year: ${payslip.month}/${payslip.year}`);
    doc.text(`Amount Credited: ₹${payslip.amountCredited}`);
    doc.end();

  } catch (err) {
    console.error("DownloadPayslip Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
// Run on 5th day of every month at 00:01 AM
cron.schedule("1 0 5 * *", async () => {
  console.log("Running monthly payslip generation...");

  try {
    const employees = await Salary.find({});

    const currentMonth = new Date().toLocaleString("default", { month: "long" });
    const currentYear = new Date().getFullYear();

    for (const emp of employees) {
      // Check if payslip already exists
      const existingPayslip = await Payslip.findOne({
        employeeId: emp._id,
        month: currentMonth,
        year: currentYear
      });

      if (!existingPayslip) {
        const payslip = await Payslip.create({
          employeeId: emp._id,
          month: currentMonth,
          year: currentYear,
          amountCredited: emp.baseSalary
        });

        emp.payslips.push(payslip._id);
        await emp.save();

        console.log(`Payslip generated for ${emp.name} (${emp.employeeId})`);
      } else {
        console.log(`Payslip already exists for ${emp.name} (${emp.employeeId})`);
      }
    }

    console.log("Monthly payslip generation completed!");
  } catch (err) {
    console.error("Error generating monthly payslips:", err);
  }
});