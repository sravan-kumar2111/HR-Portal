const Attendance = require("../models/Attendance");
const mongoose = require("mongoose");
const cron = require("node-cron");
const calculateLiveHours  = require("../../utils/liveHours"); 
// // ---------------------------
// // Logout Session
// // ---------------------------
// exports.logoutSession = async (req, res) => {
//   try {

//     console.log("BODY DATA:", req.body);

//     const userId = req.body?.employeeId;

//     if (!userId) {
//       return res.status(400).json({
//         success: false,
//         message: "employeeId required"
//       });
//     }

//     const objectId = new mongoose.Types.ObjectId(userId);

//     const today = new Date().toISOString().split("T")[0];

//     const attendance = await Attendance.findOne({
//       employeeId: objectId,
//       date: today
//     });

//     if (!attendance) {
//       return res.status(404).json({
//         success: false,
//         message: "Attendance not found"
//       });
//     }

//     attendance.lastLogout = new Date();

//     await calculateWorkHours(attendance);

//     await attendance.save();

//     res.json({
//       success: true,
//       message: "Logout recorded",
//       totalWorkHours: attendance.totalWorkHours,
//       status: attendance.status
//     });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
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

    const today = new Date().toISOString().split("T")[0];

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

// ---------------------------
// Live Working Hours
// ---------------------------
exports.getLiveHours = async (req, res) => {
  try {

    // const userId = req.body.employeeId;
    const userId = req.query.employeeId; // ✅ FIXED

    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.findOne({
      employeeId: userId,
      date: today
    });

    if (!attendance) {
      return res.json({ hours: 0 });
    }

    let total = (attendance.lastLogout || new Date()) - attendance.firstLogin;

    attendance.breaks.forEach(b => {
      if (b.start && b.end) {
        total -= (b.end - b.start);
      }
    });

    const hours = parseFloat((total / (1000 * 60 * 60)).toFixed(2));

    res.json({ hours });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
////////
cron.schedule("30 18 * * *", async () => {
  try {

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

    const day = new Date().toLocaleString("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata"
    });

    if (day === "Saturday" || day === "Sunday") {
      console.log("Weekend detected, skipping auto logout");
      return;
    }

    const holiday = await Holiday.findOne({ date: today });

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

      let total = (attendance.lastLogout - attendance.firstLogin) / (1000 * 60 * 60);

      let totalBreak = 0;

      if (attendance.breaks && attendance.breaks.length > 0) {
        attendance.breaks.forEach(b => {
          if (b.start && b.end) {
            totalBreak += (b.end - b.start) / (1000 * 60 * 60);
          }
        });
      }

      attendance.totalWorkHours = parseFloat((total - totalBreak).toFixed(2));
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
// const calculateWorkHours = (attendance, isFinal = false) => {

//   if (!attendance.sessions || attendance.sessions.length === 0) return;

//   let totalMs = 0;

//   // 👉 Session time
//   attendance.sessions.forEach(session => {
//     if (session.loginTime && session.logoutTime) {
//       totalMs += (new Date(session.logoutTime) - new Date(session.loginTime));
//     }
//   });

//   // 👉 Break time
//   let breakMs = 0;

//   if (attendance.breaks && attendance.breaks.length > 0) {
//     attendance.breaks.forEach(b => {
//       if (b.start && b.end) {
//         breakMs += (new Date(b.end) - new Date(b.start));
//       }
//     });
//   }

//   const totalHours = totalMs / (1000 * 60 * 60);
//   const breakHours = breakMs / (1000 * 60 * 60);

//   const workedHours = totalHours - breakHours;

//   attendance.totalWorkHours = parseFloat(workedHours.toFixed(2));
//   attendance.breakHours = parseFloat(breakHours.toFixed(2));

//   // ✅ Overtime starts after 8 hours
//   const OVERTIME_THRESHOLD = 8;

//   if (workedHours > OVERTIME_THRESHOLD) {
//     attendance.overtimeHours = parseFloat((workedHours - OVERTIME_THRESHOLD).toFixed(2));
//   } else {
//     attendance.overtimeHours = 0;
//   }

//   // ✅ Status only at end of day
//   if (isFinal) {

//     if (workedHours >= 7) {
//       attendance.status = "Present";       // ✅ Full Day
//     } else if (workedHours >= 5) {
//       attendance.status = "Half Day";      // ✅ Half Day
//     } else {
//       attendance.status = "Absent";        // ❌ Absent
//     }

//   }
// };
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
