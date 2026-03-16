const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  description: { type: String },
  progress: { type: String, enum: ["Completed", "Not Completed", "Pending"], default: "Pending" },
  reason: { type: String }, // required if Not Completed / Pending
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Task", TaskSchema);