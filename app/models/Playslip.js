const mongoose = require("mongoose");

const payslipSchema = new mongoose.Schema({
//   employeeId: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Salary", // Reference to Salary (Employee)
//   required: true
// },
employeeId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true
},
  month: { type: String, required: true },
  year: { type: Number, required: true },
  amountCredited: { type: Number, required: true },
  fileUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Payslip", payslipSchema); 