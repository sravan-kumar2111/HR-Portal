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
  employeeCount: { type: Number, default: 0 } ,
    // ✅ NEW FIELD
  weekOffDays: {
    type: [String],  // array of days
    enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("Department", DepartmentSchema);