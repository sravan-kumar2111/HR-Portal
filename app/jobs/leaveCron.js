const cron = require("node-cron");
const LeaveBalance = require("../models/LeaveBalance");
console.log("Leave Cron Job Loaded");
const MAX_SICK = 12;   // Max sick leave per year
const MAX_CASUAL = 12; // Max casual leave per year

// Runs at 00:00 on the 1st of every month
cron.schedule("0 0 1 * *", async () => {
  try {
    console.log("Running Monthly Leave Credit");

    const currentYear = new Date().getFullYear();

    // Fetch all leave balances
    const balances = await LeaveBalance.find();

    const bulkOps = balances.map(balance => {
      if (balance.year === currentYear) {
        // Current year → add 1 leave each (max limit)
        return {
          updateOne: {
            filter: { _id: balance._id },
            update: {
              $set: {
                sickLeave: Math.min(balance.sickLeave + 1, MAX_SICK),
                casualLeave: Math.min(balance.casualLeave + 1, MAX_CASUAL),
              },
            },
          },
        };
      } else {
        // Previous year → reset leaves to 1
        return {
          updateOne: {
            filter: { _id: balance._id },
            update: {
              $set: {
                sickLeave: 1,
                casualLeave: 1,
                year: currentYear,
              },
            },
          },
        };
      }
    });

    if (bulkOps.length > 0) {
      await LeaveBalance.bulkWrite(bulkOps);
    }

    console.log("Monthly Leave Credit Completed ✅");
  } catch (error) {
    console.error("Error in Monthly Leave Credit:", error);
  }
});



// cron.schedule("* * * * *", async () => {

//   console.log("Testing Leave Credit Cron Running");

//   try {

//     const balances = await LeaveBalance.find();

//     for (const balance of balances) {

//       balance.sickLeave += 1;
//       balance.casualLeave += 1;

//       await balance.save();

//     }

//   } catch (err) {
//     console.log("Cron Error:", err.message);
//   }

// });

