const WorkLog = require("../app/models/WorkLog");
const IdleLog = require("../app/models/IdleLog");
const Attendance = require("../app/models/Attendance");
// ---------------------------
// Calculate Work Hours
// ---------------------------
const calculateWorkHours = (attendance, isFinal = false) => {

  if (!attendance.sessions || attendance.sessions.length === 0) return;

  let totalMs = 0;

  // 👉 Session time
  attendance.sessions.forEach(session => {
    if (session.loginTime && session.logoutTime) {
      totalMs += (new Date(session.logoutTime) - new Date(session.loginTime));
    }
  });

  // 👉 Break time
  let breakMs = 0;

  if (attendance.breaks && attendance.breaks.length > 0) {
    attendance.breaks.forEach(b => {
      if (b.start && b.end) {
        breakMs += (new Date(b.end) - new Date(b.start));
      }
    });
  }

  const totalHours = totalMs / (1000 * 60 * 60);
  const breakHours = breakMs / (1000 * 60 * 60);

  const workedHours = totalHours - breakHours;

  attendance.totalWorkHours = parseFloat(workedHours.toFixed(2));
  attendance.breakHours = parseFloat(breakHours.toFixed(2));

  // ✅ Overtime starts after 8 hours
  const OVERTIME_THRESHOLD = 8;

  if (workedHours > OVERTIME_THRESHOLD) {
    attendance.overtimeHours = parseFloat((workedHours - OVERTIME_THRESHOLD).toFixed(2));
  } else {
    attendance.overtimeHours = 0;
  }

  // ✅ Status only at end of day
  if (isFinal) {

    if (workedHours >= 7) {
      attendance.status = "Present";       // ✅ Full Day
    } else if (workedHours >= 5) {
      attendance.status = "Half Day";      // ✅ Half Day
    } else {
      attendance.status = "Absent";        // ❌ Absent
    }

  }
};