const Attendance = require("../models/Attendance");
const Holiday = require("../models/Holiday");
const mongoose = require("mongoose");
const cron = require("node-cron");
const moment = require("moment-timezone");

const IST = "Asia/Kolkata";

// =======================
// TIME HELPERS (IST ONLY)
// =======================
const getNowIST = () => moment().tz(IST).toDate();

const toIST = (date) =>
  moment(date).tz(IST).format("YYYY-MM-DD hh:mm A");

const getTodayIST = () =>
  moment().tz(IST).format("YYYY-MM-DD");

// =======================
// COMMON HELPERS
// =======================
const getDurationMs = (start, end = getNowIST()) =>
  start ? new Date(end) - new Date(start) : 0;

const findTodayAttendance = async (employeeId) =>
  Attendance.findOne({
    employeeId,
    date: getTodayIST(),
  });

const closeActiveBreaksAndIdles = (attendance, endTime) => {
  attendance.breaks?.forEach(b => {
    if (b.start && !b.end) b.end = endTime;
  });

  attendance.idles?.forEach(i => {
    if (i.start && !i.end) {
      i.end = endTime;
      if (!i.reason) i.reason = "Others";
    }
  });
};

// =======================
// LOGIN (MISSING API)
// =======================
exports.loginSession = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId)
      return res.status(400).json({ message: "employeeId required" });

    const objectId = new mongoose.Types.ObjectId(employeeId);
    const today = getTodayIST();

    let attendance = await Attendance.findOne({
      employeeId: objectId,
      date: today
    });

    const now = getNowIST();

    if (!attendance) {
      attendance = await Attendance.create({
        employeeId: objectId,
        date: today,
        sessions: [{ loginTime: now }],
        firstLogin: now,
      });
    } else {
      attendance.sessions.push({ loginTime: now });
    }

    await attendance.save();

    res.json({
      success: true,
      loginTime: toIST(now)
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// LOGOUT
// =======================
exports.logoutSession = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const attendance = await findTodayAttendance(
      new mongoose.Types.ObjectId(employeeId)
    );

    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });

    const last = attendance.sessions.at(-1);

    if (!last || last.logoutTime)
      return res.status(400).json({ message: "No active session" });

    const now = getNowIST();

    last.logoutTime = now;
    attendance.lastLogout = now;

    closeActiveBreaksAndIdles(attendance, now);

    calculateWorkHours(attendance, false);

    await attendance.save();

    res.json({
      success: true,
      logoutTime: toIST(now),
      totalWorkHours: attendance.totalWorkHours,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// BREAK
// =======================
exports.startBreak = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const attendance = await findTodayAttendance(
      new mongoose.Types.ObjectId(employeeId)
    );

    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });

    const last = attendance.breaks.at(-1);

    if (last && !last.end)
      return res.status(400).json({ message: "Break already started" });

    attendance.breaks.push({ start: getNowIST() });

    await attendance.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.endBreak = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const attendance = await findTodayAttendance(
      new mongoose.Types.ObjectId(employeeId)
    );

    const last = attendance.breaks.at(-1);

    if (!last || last.end)
      return res.status(400).json({ message: "No active break" });

    last.end = getNowIST();

    await attendance.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// IDLE
// =======================
const ALLOWED_IDLE_REASONS = [
  "Break", "Washroom", "Drinking Water",
  "Meeting", "Doubts", "Others"
];

exports.startIdle = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const attendance = await findTodayAttendance(
      new mongoose.Types.ObjectId(employeeId)
    );

    const last = attendance.idles.at(-1);

    if (last && !last.end)
      return res.status(400).json({ message: "Idle already started" });

    attendance.idles.push({ start: getNowIST() });

    await attendance.save();

    const createdIdle = attendance.idles.at(-1);

    res.json({
      success: true,
      idleId: createdIdle._id
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.endIdle = async (req, res) => {
  try {
    const { employeeId, reason } = req.body;

    if (!ALLOWED_IDLE_REASONS.includes(reason))
      return res.status(400).json({ message: "Invalid reason" });

    const attendance = await findTodayAttendance(
      new mongoose.Types.ObjectId(employeeId)
    );

    const last = attendance.idles.at(-1);

    if (!last || last.end)
      return res.status(400).json({ message: "No active idle" });

    last.end = getNowIST();
    last.reason = reason;

    calculateWorkHours(attendance, false);

    await attendance.save();

    res.json({
      success: true,
      idleHours: attendance.idleHours,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// LIVE HOURS
// =======================
exports.getLiveHours = async (req, res) => {
  try {
    const { employeeId } = req.query;

    const attendance = await findTodayAttendance(
      new mongoose.Types.ObjectId(employeeId)
    );

    if (!attendance)
      return res.json({ hours: 0, breakHours: 0, idleHours: 0 });

    calculateWorkHours(attendance, false);

    res.json({
      hours: attendance.totalWorkHours,
      breakHours: attendance.breakHours,
      idleHours: attendance.idleHours,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// IDLE LOGS
// =======================
exports.getIdleLogs = async (req, res) => {
  try {
    const objectId = new mongoose.Types.ObjectId(req.params.employeeId);

    const data = await Attendance.find({ employeeId: objectId });

    const logs = data.flatMap(a =>
      (a.idles || []).map(i => ({
        date: a.date,
        start: toIST(i.start),
        end: i.end ? toIST(i.end) : null,
        reason: i.reason
      }))
    );

    res.json({ success: true, logs });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// ATTENDANCE APIs
// =======================
exports.getAllAttendance = async (req, res) => {
  const data = await Attendance.find().populate("employeeId");
  res.json({ success: true, data });
};

exports.getAttendanceById = async (req, res) => {
  const data = await Attendance.findById(req.params.id).populate("employeeId");
  res.json({ success: true, data });
};

exports.deleteAttendance = async (req, res) => {
  await Attendance.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

exports.getAttendanceByEmployeeId = async (req, res) => {
  const data = await Attendance.find({
    employeeId: new mongoose.Types.ObjectId(req.params.employeeId),
  }).sort({ date: -1 });

  res.json({ success: true, data });
};

// =======================
// HR UPDATE
// =======================
exports.hrUpdateAttendance = async (req, res) => {
  try {
    const { attendanceId, firstLogin, lastLogout } = req.body;

    const attendance = await Attendance.findById(attendanceId);

    if (firstLogin)
      attendance.firstLogin = new Date(firstLogin);

    if (lastLogout)
      attendance.lastLogout = new Date(lastLogout);

    calculateWorkHours(attendance, true);

    await attendance.save();

    res.json({ success: true, data: attendance });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// AUTO LOGOUT (CRON IST)
// =======================
cron.schedule("30 18 * * *", async () => {
  const today = getTodayIST();

  const records = await Attendance.find({ date: today });

  for (const r of records) {
    const last = r.sessions.at(-1);

    if (last && !last.logoutTime) {
      const now = getNowIST();
      last.logoutTime = now;
      r.lastLogout = now;
    }

    calculateWorkHours(r, true);
    await r.save();
  }

  console.log("Auto logout IST done");

}, { timezone: IST });

// =======================
// CALCULATE HOURS
// =======================
const calculateWorkHours = (attendance, isFinal = false) => {
  let total = 0;

  attendance.sessions.forEach(s => {
    total += getDurationMs(s.loginTime, s.logoutTime || getNowIST());
  });

  let breakMs = 0;
  attendance.breaks?.forEach(b => {
    breakMs += getDurationMs(b.start, b.end || getNowIST());
  });

  let idleMs = 0;
  attendance.idles?.forEach(i => {
    idleMs += getDurationMs(i.start, i.end || getNowIST());
  });

  const worked =
    total / 3600000 -
    breakMs / 3600000 -
    idleMs / 3600000;

  attendance.totalWorkHours = +worked.toFixed(2);
  attendance.breakHours = +(breakMs / 3600000).toFixed(2);
  attendance.idleHours = +(idleMs / 3600000).toFixed(2);

  if (isFinal) {
    if (worked >= 7) attendance.status = "Present";
    else if (worked >= 5) attendance.status = "Half Day";
    else attendance.status = "Absent";
  }
};
//////
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