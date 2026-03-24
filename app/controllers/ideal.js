// const IdleLog = require("../models/IdleLog");

// exports.startIdle = async (req, res) => {
//   try {
//     const { employeeId } = req.body;

//     const idle = await IdleLog.create({
//       employeeId,
//       startTime: new Date()
//     });

//     res.json({ success: true, idle });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.endIdle = async (req, res) => {
//   try {
//     const { idleId, reason } = req.body;

//     const idle = await IdleLog.findById(idleId);

//     if (!idle) {
//       return res.status(404).json({ message: "Idle session not found" });
//     }

//     idle.endTime = new Date();

//     const diff = idle.endTime - idle.startTime;
//     idle.duration = Math.floor(diff / (1000 * 60)); // minutes
//     idle.reason = reason;

//     await idle.save();

//     res.json({ success: true, idle });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


const Idle = require("../models/Ideal");

// 👉 Save idle time
exports.saveIdleTime = async (req, res) => {
  try {
    const { employeeId, idleTime } = req.body;

    if (!employeeId || !idleTime) {
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });
    }

    const record = await Idle.create({
      employeeId,
      idleTime,
    });

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (err) {
    console.error("Idle Save Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// 👉 Get idle time by employee
exports.getIdleTimeByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const records = await Idle.find({ employeeId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: records,
    });
  } catch (err) {
    console.error("Fetch Idle Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};