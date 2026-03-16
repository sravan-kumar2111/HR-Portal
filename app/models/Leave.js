const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({

empNumber:{
type:String,
required:true
},

employeeId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Employee"
},

leaveType:{
type:String,
enum:["sick","casual"],
required:true
},

startDate:{
type:Date,
required:true
},

endDate:{
type:Date,
required:true
},

totalDays:{
type:Number
},

reason:{
type:String
},

status:{
type:String,
enum:["pending","approved","rejected"],
default:"pending"
}

},{timestamps:true});

module.exports = mongoose.model("Leave",leaveSchema);