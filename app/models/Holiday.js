const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({

holidayName:{
type:String,
required:true
},

date:{
type:Date,
required:true,
unique: true
}

});

module.exports = mongoose.model("Holiday",holidaySchema);