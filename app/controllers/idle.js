// const cron = require("node-cron");
//   const WorkLog = require("../models/WorkLog");
//   const IdleLog = require("../models/IdleLog");
//   const User = require("../models/user");
//   const Attendance = require("../models/Attendance");

//   // ================================
//   // 🧾 FORMATTERS
//   // ================================
//   const formatDateTime = (date) => {
//     if (!date) return null;
//     return new Date(date).toLocaleString("en-IN", {
//       timeZone: "Asia/Kolkata",
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: false
//     });
//   };

//   const formatTime = (date) => {
//     if (!date) return null;
//     return new Date(date).toLocaleTimeString("en-IN", {
//       timeZone: "Asia/Kolkata",
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//       hour12: false
//     });
//   };

//   // ================================
//   // 🧠 CALCULATE LIVE HOURS
//   // ================================
//   const calculateLiveHours = async (employeeId) => {
//     try {
//       const startOfDay = new Date();
//       startOfDay.setHours(0, 0, 0, 0);

//       const workLogs = await WorkLog.find({
//         employeeId,
//         startTime: { $gte: startOfDay }
//       });

//       const idleLogs = await IdleLog.find({
//         employeeId,
//         startTime: { $gte: startOfDay }
//       });

//       let totalWorkMinutes = 0;
//       let totalIdleMinutes = 0;
//       const sessions = [];

//       // ✅ WORK
//       workLogs.forEach((log) => {
//         if (!log.startTime) return;

//         const end = log.endTime || new Date();
//         const diff = new Date(end) - new Date(log.startTime);

//         if (diff <= 0) return; // 🚫 prevent negative

//         const mins = Math.floor(diff / (1000 * 60));
//         totalWorkMinutes += mins;

//         sessions.push(
//           `${formatDateTime(log.startTime)} → ${formatDateTime(end)} = ${mins} mins`
//         );
//       });

//       // ✅ IDLE
//       idleLogs.forEach((idle) => {
//         if (!idle.startTime) return;

//         const end = idle.endTime || new Date();
//         const diff = new Date(end) - new Date(idle.startTime);

//         if (diff <= 0) return;

//         const mins = Math.floor(diff / (1000 * 60));
//         totalIdleMinutes += mins;
//       });

//       let liveMinutes = totalWorkMinutes - totalIdleMinutes;

//       if (liveMinutes < 0) liveMinutes = 0; // 🚫 safeguard

//       return {
//         sessions,
//         totalWorkMinutes,
//         totalIdleMinutes,
//         liveMinutes
//       };

//     } catch (err) {
//       console.error(err);
//       return {
//         sessions: [],
//         totalWorkMinutes: 0,
//         totalIdleMinutes: 0,
//         liveMinutes: 0
//       };
//     }
//   };

//   // ================================
//   // 🚀 START IDLE
//   // ================================
//   exports.startIdle = async (req, res) => {
//     try {
//       const { employeeId } = req.body;

//       const employee = await User.findById(employeeId);
//       if (!employee) {
//         return res.status(404).json({ success: false, message: "Employee not found" });
//       }

//       // 🛑 Stop active work
//       let workLog = await WorkLog.findOne({
//         employeeId,
//         isActive: true
//       }).sort({ createdAt: -1 });

//       if (workLog) {
//         workLog.endTime = new Date();
//         workLog.isActive = false;
//         await workLog.save();
//       }

//       // 🚫 Prevent duplicate idle
//       const existingIdle = await IdleLog.findOne({
//         employeeId,
//         endTime: null
//       });

//       if (existingIdle) {
//         return res.status(400).json({
//           success: false,
//           message: "Idle already running"
//         });
//       }

//       const idle = await IdleLog.create({
//         employeeId,
//         startTime: new Date(),
//         reason: "No activity"
//       });

//       res.status(201).json({
//         success: true,
//         message: "Idle started",
//         idle
//       });

//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ success: false, message: err.message });
//     }
//   };

//   // ================================
//   // 🚀 END IDLE
//   // ================================
//   exports.endIdle = async (req, res) => {
//     try {
//       const { idleId, reason } = req.body;

//       const idle = await IdleLog.findById(idleId);

//       if (!idle) {
//         return res.status(404).json({ success: false, message: "Idle not found" });
//       }

//       if (idle.endTime) {
//         return res.status(400).json({ success: false, message: "Idle already ended" });
//       }

//       // 🛑 End Idle
//       idle.endTime = new Date();

//       const diff = idle.endTime - idle.startTime;
//       idle.duration = diff > 0 ? Math.round(diff / (1000 * 60)) : 0;

//       idle.reason = reason || idle.reason;
//       await idle.save();

//       // ▶️ Start Work
//       const newWork = await WorkLog.create({
//         employeeId: idle.employeeId,
//         startTime: new Date(),
//         isActive: true
//       });

//       const data = await calculateLiveHours(idle.employeeId);

//       res.json({
//         success: true,
//         idle,
//         workLog: newWork,
//         breakdown: {
//           sessions: data.sessions,
//           totalWork: `${data.totalWorkMinutes} mins`,
//           idle: `${data.totalIdleMinutes} mins`,
//           live: `${data.liveMinutes} mins`
//         }
//       });

//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ success: false, message: err.message });
//     }
//   };

//   // ================================
//   // 🔁 ACTIVITY PING (AUTO FIX 🔥)
//   // ================================
//   exports.updateActivity = async (req, res) => {
//     try {
//       const { employeeId } = req.body;

//       // 🔍 If idle → stop idle
//       const idle = await IdleLog.findOne({
//         employeeId,
//         endTime: null
//       });

//       if (idle) {
//         idle.endTime = new Date();
//         idle.duration = Math.round(
//           (idle.endTime - idle.startTime) / (1000 * 60)
//         );

//         await idle.save();

//         // ▶️ Start work again
//         await WorkLog.create({
//           employeeId,
//           startTime: new Date(),
//           isActive: true
//         });

//         console.log("✅ Idle auto-stopped due to activity");
//       }

//       // 🔄 Update active work timestamp
//       await WorkLog.findOneAndUpdate(
//         { employeeId, isActive: true },
//         { updatedAt: new Date() }
//       );

//       res.json({ success: true });

//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ success: false });
//     }
//   };

//   // ================================
//   // 📊 GET TODAY IDLE
//   // ================================
//   exports.getIdleByEmployee = async (req, res) => {
//     try {
//       const { employeeId } = req.params;

//       const startOfDay = new Date();
//       startOfDay.setHours(0, 0, 0, 0);

//       const data = await IdleLog.find({
//         employeeId,
//         startTime: { $gte: startOfDay }
//       }).sort({ startTime: -1 });

//       const total = data.reduce((sum, i) => sum + (i.duration || 0), 0);

//       res.json({
//         success: true,
//         count: data.length,
//         totalIdle: total,
//         data
//       });

//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ success: false });
//     }
//   };

//   // ================================
//   // 📌 GET IDLE BY ID
//   // ================================
//   exports.getIdleById = async (req, res) => {
//     try {
//       const { idleId } = req.params;

//       const idle = await IdleLog.findById(idleId);

//       if (!idle) {
//         return res.status(404).json({
//           success: false,
//           message: "Idle record not found"
//         });
//       }

//       res.json({ success: true, idle });

//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ success: false });
//     }
//   };

const WorkLog = require("../models/WorkLog");
const IdleLog = require("../models/IdleLog");
const User = require("../models/user");
const calculateLiveHours  = require("../../utils/liveHours");  

// ================================
// 🧾 FORMATTERS
// ================================
const formatDateTime = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
};

// const calculateLiveHours = async (employeeId) => {
//   const startOfDay = new Date();
//   startOfDay.setHours(0, 0, 0, 0);

//   const workLogs = await WorkLog.find({ employeeId, startTime: { $gte: startOfDay } });
//   const idleLogs = await IdleLog.find({ employeeId, startTime: { $gte: startOfDay } });

//   const events = [];

//   // Mark work periods
//   workLogs.forEach(log => {
//     events.push({ time: new Date(log.startTime), type: 'work' });
//     events.push({ time: new Date(log.endTime || new Date()), type: 'work' });
//   });

//   // Mark idle periods
//   idleLogs.forEach(idle => {
//     events.push({ time: new Date(idle.startTime), type: 'idleStart' });
//     events.push({ time: new Date(idle.endTime || new Date()), type: 'idleEnd' });
//   });

//   events.sort((a, b) => a.time - b.time);

//   let liveMinutes = 0;
//   let totalWorkMinutes = 0;
//   let totalIdleMinutes = 0;
//   let isIdle = false;
//   let lastTime = null;

//   for (const event of events) {
//     if (lastTime) {
//       const diff = (event.time - lastTime) / (1000 * 60); // minutes
//       if (diff > 0) {
//         if (isIdle) totalIdleMinutes += diff;
//         else totalWorkMinutes += diff;  // only count as live if not idle
//         liveMinutes += isIdle ? 0 : diff;
//       }
//     }

//     // Update idle status
//     if (event.type === 'idleStart') isIdle = true;
//     if (event.type === 'idleEnd') isIdle = false;

//     lastTime = event.time;
//   }

//   return { totalWorkMinutes: Math.floor(totalWorkMinutes), totalIdleMinutes: Math.floor(totalIdleMinutes), liveMinutes: Math.floor(liveMinutes) };
// };
// ================================
// 🚀 START IDLE (PAUSE WORK)
// ================================
exports.startIdle = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // 🛑 Stop active work (PAUSE)
    const activeWork = await WorkLog.findOne({
      employeeId,
      isActive: true
    });

    if (activeWork) {
      activeWork.endTime = new Date();
      activeWork.isActive = false;
      await activeWork.save();
    }

    // 🚫 Prevent duplicate idle
    const existingIdle = await IdleLog.findOne({
      employeeId,
      endTime: null
    });

    if (existingIdle) {
      return res.status(400).json({
        success: false,
        message: "Idle already running"
      });
    }

    // 🔴 Start Idle
    const idle = await IdleLog.create({
      employeeId,
      startTime: new Date(),
      reason: "No activity"
    });

    res.status(201).json({
      success: true,
      message: "Idle started (Work paused)",
      idle
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// 🚀 END IDLE (RESUME WORK)
// ================================
exports.endIdle = async (req, res) => {
  try {
    const { idleId, reason } = req.body;

    const idle = await IdleLog.findById(idleId);

    if (!idle) {
      return res.status(404).json({
        success: false,
        message: "Idle not found"
      });
    }

    if (idle.endTime) {
      return res.status(400).json({
        success: false,
        message: "Idle already ended"
      });
    }

    // 🛑 End Idle
    idle.endTime = new Date();

    const diff = idle.endTime - idle.startTime;
    idle.duration = diff > 0 ? Math.round(diff / (1000 * 60)) : 0;

    idle.reason = reason || idle.reason;
    await idle.save();

    // ▶️ Resume Work
    const workLog = await WorkLog.create({
      employeeId: idle.employeeId,
      startTime: new Date(),
      isActive: true
    });

    const data = await calculateLiveHours(idle.employeeId);

    res.json({
      success: true,
      message: "Idle ended (Work resumed)",
      idle,
      workLog,
      breakdown: {
        sessions: data.sessions,
        totalWork: `${data.totalWorkMinutes} mins`,
        live: `${data.liveMinutes} mins`
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// 🔁 ACTIVITY PING (AUTO RESUME)
// ================================
exports.updateActivity = async (req, res) => {
  try {
    const { employeeId } = req.body;

    // 🔍 If idle exists → stop idle
    const idle = await IdleLog.findOne({
      employeeId,
      endTime: null
    });

    if (idle) {
      idle.endTime = new Date();
      idle.duration = Math.round(
        (idle.endTime - idle.startTime) / (1000 * 60)
      );

      await idle.save();

      // ▶️ Resume Work
      await WorkLog.create({
        employeeId,
        startTime: new Date(),
        isActive: true
      });

      console.log("✅ Idle auto-stopped → Work resumed");
    }

    // 🔄 Update active work heartbeat
    await WorkLog.findOneAndUpdate(
      { employeeId, isActive: true },
      { updatedAt: new Date() }
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ================================
// 📊 GET TODAY IDLE (OPTIONAL)
// ================================
exports.getIdleByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const data = await IdleLog.find({
      employeeId,
      startTime: { $gte: startOfDay }
    }).sort({ startTime: -1 });

    const totalIdle = data.reduce(
      (sum, i) => sum + (i.duration || 0),
      0
    );

    res.json({
      success: true,
      count: data.length,
      totalIdle,
      data
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
// exports.getIdleByEmployee = async (req, res) => {
//   try {
//     const { employeeId } = req.params;

//     const startOfDay = new Date();
//     startOfDay.setHours(0, 0, 0, 0);

//     // Fetch idle logs
//     const idleData = await IdleLog.find({
//       employeeId,
//       startTime: { $gte: startOfDay }
//     }).sort({ startTime: -1 });

//     const totalIdle = idleData.reduce((sum, i) => sum + (i.duration || 0), 0);

//     // ✅ Calculate live hours
//     const liveData = await calculateLiveHours(employeeId);

//     res.json({
//       success: true,
//       count: idleData.length,
//       totalIdle,
//       idleData,
//       liveHours: {
//         totalWorkMinutes: liveData.totalWorkMinutes,
//         totalIdleMinutes: liveData.totalIdleMinutes,
//         liveMinutes: liveData.liveMinutes,
//         sessions: liveData.sessions
//       }
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// ================================
// 📌 GET IDLE BY ID
// ================================
exports.getIdleById = async (req, res) => {
  try {
    const { idleId } = req.params;

    const idle = await IdleLog.findById(idleId);

    if (!idle) {
      return res.status(404).json({
        success: false,
        message: "Idle record not found"
      });
    }

    res.json({
      success: true,
      idle
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
 
 
 
 
 
 
 
 
 