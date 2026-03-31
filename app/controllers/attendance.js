const Attendance = require("../models/Attendance");
const Holiday = require("../models/Holiday");
const mongoose = require("mongoose");
const cron = require("node-cron");

const IST_TIMEZONE = "Asia/Kolkata";

const getISTNow = () =>
  new Date(new Date().toLocaleString("en-US", { timeZone: IST_TIMEZONE }));

const getISTDateString = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: IST_TIMEZONE });

const getISTDayRange = () => {
  const now = getISTNow();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const ALLOWED_IDLE_REASONS = [
  "Break",
  "Washroom",
  "Drinking Water",
  "Meeting",
  "Doubts",
  "Others"
];

const getDurationMs = (start, end = new Date()) => {
  if (!start) return 0;
  return new Date(end) - new Date(start);
};

const closeActiveBreaksAndIdles = (attendance, endTime = new Date()) => {
  if (attendance.breaks && attendance.breaks.length > 0) {
    const activeBreak = attendance.breaks.find((b) => b.start && !b.end);
    if (activeBreak) {
      activeBreak.end = endTime;
    }
  }

  if (attendance.idles && attendance.idles.length > 0) {
    const activeIdle = attendance.idles.find((idle) => idle.start && !idle.end);
    if (activeIdle) {
      activeIdle.end = endTime;
      if (!activeIdle.reason) {
        activeIdle.reason = "Others";
      }
    }
  }
};
// ---------------------------
// Logout Session
// ---------------------------
exports.logoutSession = async (req, res) => {
  try {
    const userId = req.body?.employeeId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "employeeId required"
      });
    }

    const objectId = new mongoose.Types.ObjectId(userId);

    const today = getISTDateString();

    const attendance = await Attendance.findOne({
      employeeId: objectId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found"
      });
    }

    // 👉 Get last session
    const lastSession = attendance.sessions[attendance.sessions.length - 1];

    if (!lastSession || lastSession.logoutTime) {
      return res.status(400).json({
        success: false,
        message: "No active session found"
      });
    }

    // 👉 Set logout time
    lastSession.logoutTime = new Date();

    // 👉 Update lastLogout (for UI purpose only)
    attendance.lastLogout = lastSession.logoutTime;

    // 👉 Close any active break or idle before hour calculation
    closeActiveBreaksAndIdles(attendance, lastSession.logoutTime);

    // 👉 Calculate correct hours
    await calculateWorkHours(attendance, false);

    await attendance.save();

    res.json({
      success: true,
      message: "Logout recorded",
      totalWorkHours: attendance.totalWorkHours,
      status: attendance.status
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ---------------------------
// Start Break
// ---------------------------
exports.startBreak = async (req, res) => {
  try {

    console.log("BODY DATA:", req.body);

    const userId = req.body?.employeeId;

    if (!userId) {
      return res.status(400).json({
        success:false,
        message:"employeeId required"
      });
    }

    const objectId = new mongoose.Types.ObjectId(userId);

    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.findOne({
      employeeId: objectId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        success:false,
        message:"Attendance not found"
      });
    }

    const lastBreak = attendance.breaks[attendance.breaks.length - 1];

    if (lastBreak && !lastBreak.end) {
      return res.status(400).json({
        success:false,
        message:"Break already started"
      });
    }

    attendance.breaks.push({
      start: new Date()
    });

    await attendance.save();

    res.json({
      success:true,
      message:"Break started"
    });

  } catch(err){
    res.status(500).json({message:err.message});
  }
};

// ---------------------------
// End Break
// ---------------------------
exports.endBreak = async (req, res) => {
  try {

    console.log("BODY DATA:", req.body);

    const userId = req.body?.employeeId;

    if (!userId) {
      return res.status(400).json({
        success:false,
        message:"employeeId required"
      });
    }

    const objectId = new mongoose.Types.ObjectId(userId);

    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.findOne({
      employeeId: objectId,
      date: today
    });

    if (!attendance || attendance.breaks.length === 0) {
      return res.status(404).json({
        success:false,
        message:"No break found"
      });
    }

    const lastBreak = attendance.breaks[attendance.breaks.length - 1];

    lastBreak.end = new Date();

    await attendance.save();

    res.json({
      success:true,
      message:"Break ended"
    });

  } catch(err){
    res.status(500).json({message:err.message});
  }
};

const findTodayAttendance = async (employeeId) => {
  return Attendance.findOne({
    employeeId,
    date: getISTDateString()
  });
};

exports.startIdle = async (req, res) => {
  try {
    const userId = req.body?.employeeId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "employeeId required" });
    }

    const objectId = new mongoose.Types.ObjectId(userId);
    const attendance = await findTodayAttendance(objectId);
    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance not found" });
    }

    const lastIdle = attendance.idles && attendance.idles.length > 0
      ? attendance.idles[attendance.idles.length - 1]
      : null;

    if (lastIdle && !lastIdle.end) {
      return res.status(400).json({ success: false, message: "Idle already started" });
    }

    attendance.idles.push({ start: new Date() });
    await attendance.save();

    return res.json({ success: true, message: "Idle started" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.endIdle = async (req, res) => {
  try {
    const userId = req.body?.employeeId;
    const reason = req.body?.reason;

    if (!userId) {
      return res.status(400).json({ success: false, message: "employeeId required" });
    }

    if (!reason || !ALLOWED_IDLE_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `Idle reason must be one of: ${ALLOWED_IDLE_REASONS.join(", ")}`
      });
    }

    const objectId = new mongoose.Types.ObjectId(userId);
    const attendance = await findTodayAttendance(objectId);
    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance not found" });
    }

    const lastIdle = attendance.idles && attendance.idles.length > 0
      ? attendance.idles[attendance.idles.length - 1]
      : null;

    if (!lastIdle || lastIdle.end) {
      return res.status(400).json({ success: false, message: "No active idle session found" });
    }

    lastIdle.end = new Date();
    lastIdle.reason = reason;

    calculateWorkHours(attendance, false);
    await attendance.save();

    res.json({ success: true, message: "Idle ended", idle: lastIdle, idleHours: attendance.idleHours });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getIdleLogs = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: "employeeId is required" });
    }

    const objectId = new mongoose.Types.ObjectId(employeeId);
    const attendances = await Attendance.find({ employeeId: objectId }).sort({ date: -1 });
    const idleLogs = attendances.flatMap((attendance) =>
      (attendance.idles || []).map((idle) => ({
        attendanceId: attendance._id,
        date: attendance.date,
        start: idle.start,
        end: idle.end,
        reason: idle.reason
      }))
    );

    res.json({ success: true, idleLogs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------
// Live Working Hours
// ---------------------------
exports.getLiveHours = async (req, res) => {
  try {
    const userId = req.query.employeeId;
    if (!userId) {
      return res.status(400).json({ message: "employeeId is required" });
    }

    const objectId = new mongoose.Types.ObjectId(userId);
    const todayString = getISTDateString(); // "YYYY-MM-DD"
    const { start, end } = getISTDayRange(); // full day range in Date objects

    // Try to find attendance for today (works for both string or Date)
    const attendance = await Attendance.findOne({
      employeeId: objectId,
      $or: [
        { date: todayString }, // if date stored as string
        { date: { $gte: start, $lte: end } } // if date stored as Date
      ]
    });

    if (!attendance) {
      return res.json({ hours: 0, breakHours: 0, idleHours: 0 });
    }

    // Calculate live work hours
    calculateWorkHours(attendance, false);

    res.json({
      hours: attendance.totalWorkHours || 0,
      breakHours: attendance.breakHours || 0,
      idleHours: attendance.idleHours || 0
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
////////
cron.schedule("30 18 * * *", async () => {
  try {

    const today = getISTDateString();
    const { start: holidayStart, end: holidayEnd } = getISTDayRange();

    const day = new Date().toLocaleString("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata"
    });

    if (day === "Saturday" || day === "Sunday") {
      console.log("Weekend detected, skipping auto logout");
      return;
    }

    const holiday = await Holiday.findOne({
      date: { $gte: holidayStart, $lte: holidayEnd }
    });

    if (holiday) {
      console.log("Today is holiday, skipping auto logout");
      return;
    }

    const records = await Attendance.find({ date: today });

    // ✅ FIXED LOOP
    for (const r of records) {

      const lastSession = r.sessions[r.sessions.length - 1];

      if (lastSession && !lastSession.logoutTime) {
        lastSession.logoutTime = new Date();
        r.lastLogout = new Date();
      }

      await calculateWorkHours(r, true);

      await r.save();
    }

    console.log("Auto logout executed at 6:30 PM IST");

  } catch (err) {
    console.log("Auto logout error:", err);
  }

}, {
  timezone: "Asia/Kolkata"
});

exports.getAllAttendance = async (req, res) => {
  try {

    const records = await Attendance.find()
      .populate("employeeId", "name email");

    res.json({
      success: true,
      count: records.length,
      data: records
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAttendanceById = async (req, res) => {
  try {

    const id = req.params.id;

    const record = await Attendance.findById(id)
      .populate("employeeId", "name email");

    if (!record) {
      return res.status(404).json({
        success:false,
        message:"Attendance not found"
      });
    }

    res.json({
      success:true,
      data:record
    });

  } catch (err) {
    res.status(500).json({message:err.message});
  }
};
exports.deleteAttendance = async (req, res) => {
  try {

    const id = req.params.id;

    const deleted = await Attendance.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success:false,
        message:"Attendance not found"
      });
    }

    res.json({
      success:true,
      message:"Attendance deleted"
    });

  } catch (err) {
    res.status(500).json({message:err.message});
  }
};
exports.hrUpdateAttendance = async (req, res) => {
  try {

    console.log("HR UPDATE BODY:", req.body);

    const { attendanceId, status, firstLogin, lastLogout } = req.body;

    if (!attendanceId) {
      return res.status(400).json({
        success: false,
        message: "attendanceId is required"
      });
    }

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    // ---------------------------
    // Update Status (optional)
    // ---------------------------
    if (status !== undefined) {
      attendance.status = status;
    }

    // ---------------------------
    // Update First Login (optional)
    // ---------------------------
    if (firstLogin !== undefined) {

      const loginTime = new Date(firstLogin);
      attendance.firstLogin = loginTime;

      if (!attendance.sessions || attendance.sessions.length === 0) {
        attendance.sessions = [{ loginTime }];
      } else {
        attendance.sessions[0].loginTime = loginTime;
      }
    }

    // ---------------------------
    // Update Last Logout (optional)
    // ---------------------------
    if (lastLogout !== undefined) {

      const logoutTime = new Date(lastLogout);
      attendance.lastLogout = logoutTime;

      if (!attendance.sessions || attendance.sessions.length === 0) {
        attendance.sessions = [{
          loginTime: attendance.firstLogin || logoutTime,
          logoutTime
        }];
      } else {
        attendance.sessions[attendance.sessions.length - 1].logoutTime = logoutTime;
      }
    }

    // ---------------------------
    // Recalculate Work Hours
    // ---------------------------
    if (attendance.firstLogin && attendance.lastLogout) {
      const total = (attendance.lastLogout - attendance.firstLogin) / (1000 * 60 * 60);

      let totalBreak = 0;
      if (attendance.breaks && attendance.breaks.length > 0) {
        attendance.breaks.forEach((b) => {
          if (b.start && b.end) {
            totalBreak += (new Date(b.end) - new Date(b.start)) / (1000 * 60 * 60);
          }
        });
      }

      let totalIdle = 0;
      if (attendance.idles && attendance.idles.length > 0) {
        attendance.idles.forEach((idle) => {
          if (idle.start && idle.end) {
            totalIdle += (new Date(idle.end) - new Date(idle.start)) / (1000 * 60 * 60);
          }
        });
      }

      attendance.totalWorkHours = parseFloat((total - totalBreak - totalIdle).toFixed(2));
    }

    await attendance.save();

    res.json({
      success: true,
      message: "Attendance updated by HR successfully",
      data: attendance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// ---------------------------
// Calculate Work Hours
// ---------------------------
const calculateWorkHours = (attendance, isFinal = false) => {
  if (!attendance.sessions || attendance.sessions.length === 0) {
    attendance.totalWorkHours = 0;
    attendance.breakHours = 0;
    attendance.idleHours = 0;
    attendance.overtimeHours = 0;
    return;
  }

  const now = new Date();
  let totalMs = 0;
  attendance.sessions.forEach((session) => {
    if (!session.loginTime) return;
    const sessionEnd = session.logoutTime ? new Date(session.logoutTime) : now;
    totalMs += getDurationMs(session.loginTime, sessionEnd);
  });

  let breakMs = 0;
  if (attendance.breaks && attendance.breaks.length > 0) {
    attendance.breaks.forEach((b) => {
      if (!b.start) return;
      const breakEnd = b.end ? new Date(b.end) : now;
      breakMs += getDurationMs(b.start, breakEnd);
    });
  }

  let idleMs = 0;
  if (attendance.idles && attendance.idles.length > 0) {
    attendance.idles.forEach((idle) => {
      if (!idle.start) return;
      const idleEnd = idle.end ? new Date(idle.end) : now;
      idleMs += getDurationMs(idle.start, idleEnd);
    });
  }

  const totalHours = totalMs / (1000 * 60 * 60);
  const breakHours = breakMs / (1000 * 60 * 60);
  const idleHours = idleMs / (1000 * 60 * 60);
  const workedHours = totalHours - breakHours - idleHours;

  attendance.totalWorkHours = parseFloat(Math.max(workedHours, 0).toFixed(2));
  attendance.breakHours = parseFloat(Math.max(breakHours, 0).toFixed(2));
  attendance.idleHours = parseFloat(Math.max(idleHours, 0).toFixed(2));

  const OVERTIME_THRESHOLD = 8;
  if (workedHours > OVERTIME_THRESHOLD) {
    attendance.overtimeHours = parseFloat((workedHours - OVERTIME_THRESHOLD).toFixed(2));
  } else {
    attendance.overtimeHours = 0;
  }

  if (isFinal) {
    if (workedHours >= 7) {
      attendance.status = "Present";
    } else if (workedHours >= 5) {
      attendance.status = "Half Day";
    } else {
      attendance.status = "Absent";
    }
  }
};
// Get attendance by employeeId
exports.getAttendanceByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID format"
      });
    }

    // ✅ Fetch all attendance records for employee
    const records = await Attendance.find({
      employeeId: new mongoose.Types.ObjectId(employeeId)
    })
      .sort({ date: -1 }) // latest first
      .populate("employeeId", "name email department");

    if (!records.length) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found for this employee"
      });
    }

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });

  } catch (err) {
    console.error("Error fetching attendance:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
// ---------------------------
// Get single idle by ID
// ---------------------------
exports.getIdleById = async (req, res) => {
  try {
    const idleId = req.params.id;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(idleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid idle ID"
      });
    }

    // Fetch all attendances that might contain this idle
    const attendance = await Attendance.findOne({
      "idles._id": idleId
    }).populate("employeeId", "name email department");

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Idle not found"
      });
    }

    // Find the specific idle
    const idle = attendance.idles.id(idleId); // Mongoose subdocument id method

    res.json({
      success: true,
      idle,
      employee: attendance.employeeId,
      attendanceDate: attendance.date
    });

  } catch (err) {
    console.error("Error fetching idle by ID:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};