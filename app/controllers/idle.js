// const WorkLog = require("../models/WorkLog");
// const IdleLog = require("../models/IdleLog");
// const User = require("../models/user");


// // 🧠 Helper: Format Time (10:00)
// const formatTime = (date) => {
//   return new Date(date).toLocaleTimeString("en-IN", {
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: false
//   });
// };


// // 🧠 Calculate Live Hours + Breakdown
// // const calculateLiveHours = async (employeeId) => {
// //   try {
// //     const workLogs = await WorkLog.find({ employeeId }).sort({ startTime: 1 });
// //     const idleLogs = await IdleLog.find({ employeeId });

// //     let totalWorkMinutes = 0;
// //     let totalIdleMinutes = 0;

// //     const sessions = [];

// //     // ✅ Work Sessions
// //     workLogs.forEach((log) => {
// //       if (log.startTime && log.endTime) {
// //         const minutes = Math.floor(
// //           (new Date(log.endTime) - new Date(log.startTime)) / (1000 * 60)
// //         );

// //         totalWorkMinutes += minutes;

// //         sessions.push(
// //           `${formatTime(log.startTime)} → ${formatTime(log.endTime)} = ${minutes} mins`
// //         );
// //       }
// //     });

// //     // ✅ Idle Time
// //     idleLogs.forEach((idle) => {
// //       if (idle.duration) {
// //         totalIdleMinutes += idle.duration;
// //       }
// //     });

// //     return {
// //       sessions,
// //       totalWorkMinutes,
// //       totalIdleMinutes,
// //       liveMinutes: totalWorkMinutes // already split logic
// //     };

// //   } catch (err) {
// //     console.error("LiveHours Calc Error:", err);
// //     return {
// //       sessions: [],
// //       totalWorkMinutes: 0,
// //       totalIdleMinutes: 0,
// //       liveMinutes: 0
// //     };
// //   }
// // };
// const calculateLiveHours = async (employeeId) => {
//   try {
//     const startOfDay = new Date();
//     startOfDay.setHours(0, 0, 0, 0);

//     const workLogs = await WorkLog.find({
//       employeeId,
//       startTime: { $gte: startOfDay }
//     });

//     const idleLogs = await IdleLog.find({
//       employeeId,
//       startTime: { $gte: startOfDay }
//     });

//     let totalWorkMinutes = 0;
//     let totalIdleMinutes = 0;

//     const sessions = [];

//     // ✅ Work Sessions
//     workLogs.forEach((log) => {
//       if (log.startTime) {
//         const end = log.endTime || new Date();

//         const minutes = Math.floor(
//           (new Date(end) - new Date(log.startTime)) / (1000 * 60)
//         );

//         totalWorkMinutes += minutes;

//         sessions.push(
//           `${formatTime(log.startTime)} → ${formatTime(end)} = ${minutes} mins`
//         );
//       }
//     });

//     // ✅ Idle Sessions
//     idleLogs.forEach((idle) => {
//       if (idle.startTime) {
//         const end = idle.endTime || new Date();

//         const minutes = Math.floor(
//           (new Date(end) - new Date(idle.startTime)) / (1000 * 60)
//         );

//         totalIdleMinutes += minutes;
//       }
//     });

//     return {
//       sessions,
//       totalWorkMinutes,
//       totalIdleMinutes,
//       liveMinutes: totalWorkMinutes - totalIdleMinutes
//     };

//   } catch (err) {
//     console.error(err);
//     return {
//       sessions: [],
//       totalWorkMinutes: 0,
//       totalIdleMinutes: 0,
//       liveMinutes: 0
//     };
//   }
// };

// // 🚀 START IDLE
// exports.startIdle = async (req, res) => {
//   try {
//     const { employeeId } = req.body;

//     // ✅ Check user
//     const employee = await User.findById(employeeId);
//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found"
//       });
//     }

//     // 🔍 Find active work
//     let workLog = await WorkLog.findOne({
//       employeeId,
//       isActive: true
//     }).sort({ createdAt: -1 });

//     // 🆕 Create if not exists
//     if (!workLog) {
//       workLog = await WorkLog.create({
//         employeeId,
//         startTime: new Date(),
//         isActive: true
//       });
//     }

//     // 🚨 IMPORTANT: END WORK SESSION
//     workLog.endTime = new Date();
//     workLog.isActive = false;
//     await workLog.save();

//     // 🚫 Prevent duplicate idle
//     const existingIdle = await IdleLog.findOne({
//       employeeId,
//       endTime: null
//     });

//     if (existingIdle) {
//       return res.status(400).json({
//         success: false,
//         message: "Idle already running"
//       });
//     }

//     // 📝 Create idle
//     const idle = await IdleLog.create({
//       employeeId,
//       workLogId: workLog._id,
//       startTime: new Date(),
//       reason: "No activity"
//     });

//     res.status(201).json({
//       success: true,
//       message: "Idle started",
//       idle
//     });

//   } catch (err) {
//     console.error("START IDLE ERROR:", err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// };


// // 🚀 END IDLE
// exports.endIdle = async (req, res) => {
//   try {
//     const { idleId, reason } = req.body;

//     if (!idleId) {
//       return res.status(400).json({
//         success: false,
//         message: "idleId is required"
//       });
//     }

//     const idle = await IdleLog.findById(idleId);

//     if (!idle) {
//       return res.status(404).json({
//         success: false,
//         message: "Idle not found"
//       });
//     }

//     if (idle.endTime) {
//       return res.status(400).json({
//         success: false,
//         message: "Idle already ended"
//       });
//     }

//     // 🛑 End idle
//     idle.endTime = new Date();
//     idle.duration = Math.round(
//       (idle.endTime - idle.startTime) / (1000 * 60)
//     );
//     idle.reason = reason || idle.reason;

//     await idle.save();

//     // ▶️ START NEW WORK SESSION (IMPORTANT)
//     const newWork = await WorkLog.create({
//       employeeId: idle.employeeId,
//       startTime: new Date(),
//       isActive: true
//     });

//     // 📊 Calculate live hours
//     const data = await calculateLiveHours(idle.employeeId);

//     res.json({
//       success: true,
//       idle,
//       workLog: newWork,

//       breakdown: {
//         sessions: data.sessions,
//         totalWork: `${data.totalWorkMinutes} mins`,
//         idle: `${data.totalIdleMinutes} mins`,
//         live: `${data.liveMinutes} mins`
//       }
//     });

//   } catch (err) {
//     console.error("END IDLE ERROR:", err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// };

const cron = require("node-cron");
const WorkLog = require("../models/WorkLog");
const IdleLog = require("../models/IdleLog");
const User = require("../models/user");


const formatDateTime = (date) => {
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

// 🧠 CALCULATE LIVE HOURS (CORRECT)
const calculateLiveHours = async (employeeId) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const workLogs = await WorkLog.find({
      employeeId,
      startTime: { $gte: startOfDay }
    });

    const idleLogs = await IdleLog.find({
      employeeId,
      startTime: { $gte: startOfDay }
    });

    let totalWorkMinutes = 0;
    let totalIdleMinutes = 0;
    const sessions = [];

    // ✅ Work
    workLogs.forEach((log) => {
      if (log.startTime) {
        const end = log.endTime || new Date();

        const mins = Math.floor(
          (new Date(end) - new Date(log.startTime)) / (1000 * 60)
        );

        totalWorkMinutes += mins;

        sessions.push(
          `${formatTime(log.startTime)} → ${formatTime(end)} = ${mins} mins`
        );
      }
    });

    // ✅ Idle
    idleLogs.forEach((idle) => {
      if (idle.startTime) {
        const end = idle.endTime || new Date();

        const mins = Math.floor(
          (new Date(end) - new Date(idle.startTime)) / (1000 * 60)
        );

        totalIdleMinutes += mins;
      }
    });

    return {
      sessions,
      totalWorkMinutes,
      totalIdleMinutes,
      liveMinutes: totalWorkMinutes - totalIdleMinutes
    };

  } catch (err) {
    console.error(err);
    return {
      sessions: [],
      totalWorkMinutes: 0,
      totalIdleMinutes: 0,
      liveMinutes: 0
    };
  }
};


// // 🔁 ACTIVITY PING (VERY IMPORTANT)


// 🚀 START IDLE (MANUAL OR AUTO)
exports.startIdle = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    let workLog = await WorkLog.findOne({
      employeeId,
      isActive: true
    }).sort({ createdAt: -1 });

    if (!workLog) {
      workLog = await WorkLog.create({
        employeeId,
        startTime: new Date(),
        isActive: true
      });
    }

    // 🛑 End Work
    workLog.endTime = new Date();
    workLog.isActive = false;
    await workLog.save();

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

    const idle = await IdleLog.create({
      employeeId,
      workLogId: workLog._id,
      startTime: new Date(),
      reason: "No activity"
    });

    res.status(201).json({
      success: true,
      message: "Idle started",
      idle
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// 🚀 END IDLE (UNLOCK + REASON)
exports.endIdle = async (req, res) => {
  try {
    const { idleId, reason } = req.body;

    const idle = await IdleLog.findById(idleId);

    if (!idle) {
      return res.status(404).json({ success: false, message: "Idle not found" });
    }

    if (idle.endTime) {
      return res.status(400).json({ success: false, message: "Idle already ended" });
    }

    // 🛑 End Idle
    idle.endTime = new Date();
    idle.duration = Math.round(
      (idle.endTime - idle.startTime) / (1000 * 60)
    );
    idle.reason = reason || idle.reason;

    await idle.save();

    // ▶️ Start Work (SAFE)
    const existingWork = await WorkLog.findOne({
      employeeId: idle.employeeId,
      isActive: true
    });

    let newWork;

    if (!existingWork) {
      newWork = await WorkLog.create({
        employeeId: idle.employeeId,
        startTime: new Date(),
        isActive: true
      });
    } else {
      newWork = existingWork;
    }

    const data = await calculateLiveHours(idle.employeeId);

    res.json({
      success: true,
      idle,
      workLog: newWork,
      breakdown: {
        sessions: data.sessions,
        totalWork: `${data.totalWorkMinutes} mins`,
        idle: `${data.totalIdleMinutes} mins`,
        live: `${data.liveMinutes} mins`
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
//Helper to format time like 10:00

// GET employee work & idle by employeeId
// exports.getIdleByEmployee = async (req, res) => {
//   try {
//     const { employeeId } = req.params; // or req.body if you prefer POST

//     if (!employeeId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "employeeId is required" });
//     }

//     const employee = await User.findById(employeeId);

//     if (!employee) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Employee not found" });
//     }

//     // Fetch work logs
//     const workLogs = await WorkLog.find({ employeeId }).sort({ startTime: -1 });

//     // Fetch idle logs
//     const idleLogs = await IdleLog.find({ employeeId }).sort({ startTime: -1 });

//     // Optional: live hours calculation
//     let totalWorkMinutes = 0;
//     let totalIdleMinutes = 0;
//     const sessions = [];

//     workLogs.forEach((log) => {
//       const start = log.startTime;
//       const end = log.endTime || new Date();
//       const mins = Math.floor((new Date(end) - new Date(start)) / (1000 * 60));
//       totalWorkMinutes += mins;
//       sessions.push(`${formatTime(start)} → ${formatTime(end)} = ${mins} mins`);
//     });

//     idleLogs.forEach((idle) => {
//       const start = idle.startTime;
//       const end = idle.endTime || new Date();
//       const mins = Math.floor((new Date(end) - new Date(start)) / (1000 * 60));
//       totalIdleMinutes += mins;
//     });

//     const liveMinutes = totalWorkMinutes - totalIdleMinutes;

//     res.json({
//       success: true,
//       employee: {
//         _id: employee._id,
//         name: employee.name,
//         empNumber: employee.empNumber,
//       },
//       workLogs,
//       idleLogs,
//       breakdown: {
//         sessions,
//         totalWork: `${totalWorkMinutes} mins`,
//         totalIdle: `${totalIdleMinutes} mins`,
//         live: `${liveMinutes} mins`,
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching employee logs:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
exports.updateActivity = async (req, res) => {
  try {
    const { employeeId } = req.body;

    await WorkLog.findOneAndUpdate(
      { employeeId, isActive: true },
      { updatedAt: new Date() }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// const WorkLog = require("../models/WorkLog");

// const IdleLog = require("../models/IdleLog");

// const User = require("../models/user");
 
 
// // 🔁 ACTIVITY PING (MOST IMPORTANT)

// exports.updateActivity = async (req, res) => {

//   try {

//     const { employeeId } = req.body;
 
//     // 🔍 If idle → STOP idle

//     const idle = await IdleLog.findOne({

//       employeeId,

//       endTime: null,

//     });
 
//     if (idle) {

//       idle.endTime = new Date();

//       idle.duration = Math.round(

//         (idle.endTime - idle.startTime) / (1000 * 60)

//       );

//       await idle.save();
 
//       // ▶️ Start new work

//       await WorkLog.create({

//         employeeId,

//         startTime: new Date(),

//         isActive: true,

//       });
 
//       console.log("✅ Idle stopped automatically");

//     }
 
//     // 🔄 Update last activity

//     await WorkLog.findOneAndUpdate(

//       { employeeId, isActive: true },

//       { updatedAt: new Date() }

//     );
 
//     res.json({ success: true });
 
//   } catch (err) {

//     res.status(500).json({ success: false });

//   }

// };
 
 
// // 🚀 START IDLE (manual optional)

// exports.startIdle = async (req, res) => {

//   try {

//     const { employeeId } = req.body;
 
//     const work = await WorkLog.findOne({

//       employeeId,

//       isActive: true,

//     });
 
//     if (work) {

//       work.endTime = new Date();

//       work.isActive = false;

//       await work.save();

//     }
 
//     const idle = await IdleLog.create({

//       employeeId,

//       startTime: new Date(),

//     });
 
//     res.json({ success: true, idle });
 
//   } catch (err) {

//     res.status(500).json({ success: false });

//   }

// };
 
 
// // 🚀 END IDLE (with reason)

// exports.endIdle = async (req, res) => {

//   try {

//     const { idleId, reason } = req.body;
 
//     const idle = await IdleLog.findById(idleId);
 
//     if (!idle || idle.endTime) {

//       return res.status(400).json({ message: "Invalid idle" });

//     }
 
//     idle.endTime = new Date();

//     idle.duration = Math.round(

//       (idle.endTime - idle.startTime) / (1000 * 60)

//     );

//     idle.reason = reason || idle.reason;
 
//     await idle.save();
 
//     await WorkLog.create({

//       employeeId: idle.employeeId,

//       startTime: new Date(),

//       isActive: true,

//     });
 
//     res.json({ success: true, idle });
 
//   } catch (err) {

//     res.status(500).json({ success: false });

//   }

// };
 
 
// // 📊 GET DAILY IDLE

exports.getIdleByEmployee = async (req, res) => {

  try {

    const { employeeId } = req.params;
 
    const today = new Date().toISOString().split("T")[0];
 
    const data = await IdleLog.find({

      employeeId,

      date: today,

    }).sort({ startTime: -1 });
 
    const total = data.reduce((s, i) => s + (i.duration || 0), 0);
 
    res.json({

      count: data.length,

      totalIdle: total,

      data,

    });
 
  } catch (err) {

    res.status(500).json({ success: false });

  }

};
// // 📌 GET IDLE BY ID
exports.getIdleById = async (req, res) => {
  try {
    const { idleId } = req.params;

    if (!idleId) {
      return res.status(400).json({ success: false, message: "idleId is required" });
    }

    const idle = await IdleLog.findById(idleId);

    if (!idle) {
      return res.status(404).json({ success: false, message: "Idle record not found" });
    }

    res.json({ success: true, idle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};