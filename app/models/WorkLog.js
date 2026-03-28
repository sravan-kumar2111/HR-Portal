// const mongoose = require("mongoose");

// const workLogSchema = new mongoose.Schema(
//   {
//     employeeId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Employee",
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

//     isActive: {
//       type: Boolean,
//       default: true
//     }

//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("WorkLog", workLogSchema);


const mongoose = require("mongoose");
 
const workSchema = new mongoose.Schema({

  employeeId: {

    type: mongoose.Schema.Types.ObjectId,

    ref: "User",

  },
 
  startTime: Date,

  endTime: Date,
 
  isActive: {

    type: Boolean,

    default: true,

  },
 
  updatedAt: {

    type: Date,

    default: Date.now,

  },

}, { timestamps: true });
 
module.exports = mongoose.model("WorkLog", workSchema);
 