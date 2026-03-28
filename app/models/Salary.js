const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
  
   employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true   // ✅ IMPORTANT
  },
  name: { type: String, required: true },
   email: { type: String, required: true, unique: true },
  department: { type: String },
  baseSalary: { type: Number, required: true },  // base salary
  payslips: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payslip" }],
});

module.exports = mongoose.model("Salary", salarySchema);