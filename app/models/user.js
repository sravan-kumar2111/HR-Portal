// const mongoose = require("mongoose");

// const UserSchema = new mongoose.Schema({

//   name:String,

//   email:{
//     type:String,
//     unique:true
//   },

//   password:String,

//   role:{
//     type:String,
//     enum:["admin","hr","employee"]
//   },

//   department:String,
//   designation:String,

//   firstLogin:{
//     type:Boolean,
//     default:true
//   },

//   passwordChangedAt:{
//     type:Date,
//     default:Date.now
//   }

// },{timestamps:true});

// module.exports = mongoose.model("User",UserSchema);



const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  empId: {
    type: String,
    unique: true
  },

  email: {
    type: String,
    unique: true,
    required: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["admin", "hr", "employee"],
    required: true
  },

  phone: {
    type: String
  },

  gender: {
    type: String,
    enum: ["male", "female", "other"]
  },

  dateOfBirth: {
    type: Date
  },

  dateOfJoining: {
    type: Date
  },

  department: {
    type: String
  },

  designation: {
    type: String
  },

  address: {
    type: String
  },

  firstLogin: {
    type: Boolean,
    default: true
  },

  passwordChangedAt: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);