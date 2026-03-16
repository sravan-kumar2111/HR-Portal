const mongoose = require("mongoose");

// Optional session history
const sessionSchema = new mongoose.Schema({
  loginTime: { type: Date, required: true },
  logoutTime: { type: Date }
});

// Break tracking
const breakSchema = new mongoose.Schema({
  start: { type: Date, required: true },
  end: { type: Date }
});

// Main Attendance
const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },

  firstLogin: { type: Date },
  lastLogout: { type: Date },

  sessions: [sessionSchema],
  breaks: [breakSchema],

  totalWorkHours: { type: Number, default: 0 },
  breakHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },

  status: { type: String, enum: ["present", "half_day", "absent"], default: "present" }

}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);