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

// Idle tracking
const idleSchema = new mongoose.Schema({
  start: { type: Date, required: true },
  end: { type: Date },
  reason: {
    type: String,
    trim: true,
    enum: [
      "Break",
      "Washroom",
      "Drinking Water",
      "Meeting",
      "Doubts",
      "Others"
    ]
  }
});

// Main Attendance
const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },

  firstLogin: { type: Date },
  lastLogout: { type: Date },

  sessions: [sessionSchema],
  breaks: [breakSchema],
  idles: [idleSchema],

  totalWorkHours: { type: Number, default: 0 },
  breakHours: { type: Number, default: 0 },
  idleHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },

  // status: { type: String, enum: ["Present", "Half Day", "Absent"], default: "Present" }
 status: {
  type: String,
  enum: [
    "Present",
    "Absent",
    "Late",
    "Half Day",
    "Holiday",
    "Week Off",
    "Present (WeekOff Work)",
    "Present (Holiday Work)"
  ],
  required: true,
},
isWeekOff: {
  type: Boolean,
  default: false
}

}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);