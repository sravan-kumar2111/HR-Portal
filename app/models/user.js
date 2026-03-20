const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    // empId: {
    //   type: String,
    //   required: true,
    //   unique: true
    // },
    empId: {
  type: String,
  unique: true,
  required: function () {
    return this.role !== "admin";
  }
},

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["admin", "hr", "employee"],
      default: "employee"
    },

    // 🔗 Reference to Department
    // department: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Department",
    //   required: true
    // },
department: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Department",
  required: function () {
    return this.role !== "admin";
  }
},
    designation: {
      type: String
    },

    phone: {
      type: String
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"]
    },

    dateOfBirth: {
      type: Date
    },

    dateOfJoining: {
      type: Date
    },

    address: {
      type: String
    },

    firstLogin: {
      type: Boolean,
      default: true
    },
    resetToken: {
  type: String
},
resetTokenExpiry: {
  type: Date
}
  },
  {
    timestamps: true
  }
);

// ✅ Export model (VERY IMPORTANT)
module.exports = mongoose.model("User", UserSchema);

// models/User.js
