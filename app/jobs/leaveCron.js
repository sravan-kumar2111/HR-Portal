const cron = require("node-cron");
const LeaveBalance = require("../models/LeaveBalance");
console.log("Leave Cron Job Loaded");

/////Important Cron Job - Monthly Leave Credit/////////
// cron.schedule("0 0 1 * *", async ()=>{

// console.log("Running Monthly Leave Credit");

// const currentYear = new Date().getFullYear();

// const balances = await LeaveBalance.find();

// for(const balance of balances){

// if(balance.year === currentYear){

// balance.sickLeave += 1;
// balance.casualLeave += 1;

// }else{

// balance.sickLeave = 1;
// balance.casualLeave = 1;
// balance.year = currentYear;

// }

// await balance.save();

// }

// });



cron.schedule("* * * * *", async () => {

  console.log("Testing Leave Credit Cron Running");

  try {

    const balances = await LeaveBalance.find();

    for (const balance of balances) {

      balance.sickLeave += 1;
      balance.casualLeave += 1;

      await balance.save();

    }

  } catch (err) {
    console.log("Cron Error:", err.message);
  }

});


// // Runs every December 31 at 11:59 PM
// cron.schedule("59 23 31 12 *", async () => {
//   const nextYear = new Date().getFullYear() + 1;
//   await generateWeekends(nextYear);
// });