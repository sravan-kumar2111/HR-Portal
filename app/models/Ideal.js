// const mongoose = require("mongoose");

// const idleLogSchema = new mongoose.Schema({
//   employeeId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "user"
//   },
//   startTime: Date,
//   endTime: Date,
//   duration: Number, // in minutes
//   reason: String,
//   date: {
//     type: Date,
//     default: Date.now
//   }
// }, { timestamps: true });

// module.exports = mongoose.model("IdleLog", idleLogSchema);


const mongoose = require("mongoose");

const idleSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
  },
  idleTime: {
    type: Number, // in seconds
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model("Idle", idleSchema);