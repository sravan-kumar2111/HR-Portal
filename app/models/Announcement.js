// const mongoose = require("mongoose");

// const announcementSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     message: {
//       type: String,
//       required: true,
//     },

//     // Departments targeting
//     departments: [
//       {
//         type: String,
        
//       },
//     ],

//     // Send to all departments
//     isForAll: {
//       type: Boolean,
//       default: false,
//     },

//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Announcement", announcementSchema);



const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
    },

    // ✅ Store department IDs instead of names
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department", // your Department model
      },
    ],

    isForAll: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);