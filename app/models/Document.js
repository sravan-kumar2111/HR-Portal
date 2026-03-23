const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
 employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  filePath: { type: String, required: true },
  fileType: { type: String, required: true },
  originalName: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Document", documentSchema);