const cron = require("node-cron");
const WorkLog = require("../app/models/WorkLog");
const IdleLog = require("../app/models/IdleLog");

const autoIdleTracker = () => {
  cron.schedule("* * * * *", async () => {
    try {
      console.log("⏳ Checking inactive users...");

      const activeWorkLogs = await WorkLog.find({ isActive: true });

      for (const work of activeWorkLogs) {
        const lastActivity = work.updatedAt || work.startTime;

        const diffMinutes =
          (new Date() - new Date(lastActivity)) / (1000 * 60);

        if (diffMinutes >= 5) {
          console.log(`🚫 Auto idle for ${work.employeeId}`);

          const existingIdle = await IdleLog.findOne({
            employeeId: work.employeeId,
            endTime: null
          });

          if (existingIdle) continue;

          // 🛑 End Work
          work.endTime = new Date();
          work.isActive = false;
          await work.save();

          // 📝 Start Idle
          await IdleLog.create({
            employeeId: work.employeeId,
            workLogId: work._id,
            startTime: new Date(),
            reason: "Auto Idle"
          });
        }
      }
    } catch (err) {
      console.error("AUTO IDLE ERROR:", err);
    }
  });
};

module.exports = autoIdleTracker;
