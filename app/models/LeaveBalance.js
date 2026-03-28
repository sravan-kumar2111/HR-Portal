const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema({

  employeeId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",   // reference to Employee collection
    required: true
  },

  empNumber:{
    type:String,
    required:true,
    unique:true
  },

  sickLeave:{
    type:Number,
    default:0
  },

  casualLeave:{
    type:Number,
    default:0
  },

  // year:{
  //   type:Number,
  //   default:new Date().getFullYear()
  // }
  year: {
  type: Number,
  default: new Date().getFullYear(),
}

},{timestamps:true});

module.exports = mongoose.model("LeaveBalance",leaveBalanceSchema);