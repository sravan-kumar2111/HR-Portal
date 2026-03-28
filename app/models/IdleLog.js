// const mongoose = require("mongoose");

// const idleLogSchema = new mongoose.Schema(
//   {
//     employeeId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Employee",
//       required: true
//     },

//     workLogId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "WorkLog",
//       required: true
//     },

//     startTime: {
//       type: Date,
//       default: Date.now
//     },

//     endTime: {
//       type: Date,
//       default: null
//     },

//     duration: {
//   type: Number, // in minutes ✅
//   default: 0
// },

//     reason: {
//       type: String,
//       enum: [
//         "No activity",
//         "Break",
//         "Meeting",
//         "DrinkingWater",
//         "Washroom",
//         "Doubt",
//         "Other"
//       ],
//       default: "No activity"
//     }
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("IdleLog", idleLogSchema);



const mongoose = require("mongoose");
 
const idleSchema = new mongoose.Schema({

  employeeId: {

    type: mongoose.Schema.Types.ObjectId,

    ref: "User",

  },
 
  workLogId: {

    type: mongoose.Schema.Types.ObjectId,

    ref: "WorkLog",

  },
 
  startTime: Date,

  endTime: Date,
 
  duration: Number, // minutes
 
  reason: {

    type: String,
     enum: [
        "No activity",
        "Break",
        "Meeting",
        "DrinkingWater",
        "Washroom",
        "Doubt",
        "Other",
        "Meeting",
      ],

    default: "Auto Idle",

  },
 
  date: {

    type: String,

    default: () => new Date().toISOString().split("T")[0],

  },

}, { timestamps: true });
 
module.exports = mongoose.model("IdleLog", idleSchema);
 