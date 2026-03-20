const IdleLog = require("../models/IdleLog");

exports.startIdle = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const idle = await IdleLog.create({
      employeeId,
      startTime: new Date()
    });

    res.json({ success: true, idle });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.endIdle = async (req, res) => {
  try {
    const { idleId, reason } = req.body;

    const idle = await IdleLog.findById(idleId);

    if (!idle) {
      return res.status(404).json({ message: "Idle session not found" });
    }

    idle.endTime = new Date();

    const diff = idle.endTime - idle.startTime;
    idle.duration = Math.floor(diff / (1000 * 60)); // minutes
    idle.reason = reason;

    await idle.save();

    res.json({ success: true, idle });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};