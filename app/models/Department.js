const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema({
  departmentName: {
    type: String,
    required: true,
    unique: true
  },
  managerName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  employeeCount: { type: Number, default: 0 } 
}, { timestamps: true });

module.exports = mongoose.model("Department", DepartmentSchema);