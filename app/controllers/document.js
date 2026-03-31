const Document = require("../models/Document");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Employee = require("../models/user");

exports.uploadDocument = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const { title, description, employeeId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    const documents = req.files.map(file => ({
      title, // ✅ from body
      description,
      employeeId,
      fileType: file.mimetype, // ✅ REQUIRED FIELD
      originalName: file.originalname,
      filePath: file.path
    }));

    const savedDocs = await Document.insertMany(documents);

    res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      documents: savedDocs
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found in DB"
      });
    }

    const filePath = path.resolve(doc.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: `File not found on server: ${filePath}`
      });
    }

    res.download(filePath, doc.originalName);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
// Get all documents
exports.getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find(); // remove populate temporarily
    res.status(200).json({ success: true, data: documents });
  } catch (err) {
    console.error("Mongo error:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get single document
// controllers/documentController.js


exports.getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    let employeeInfo = null;

    // ✅ Handle ObjectId employeeId
    if (doc.employeeId && mongoose.Types.ObjectId.isValid(doc.employeeId)) {
      employeeInfo = await Employee.findById(doc.employeeId, "name email department");
    }

    // ✅ Handle string employeeId like EMP001
    if (!employeeInfo && doc.employeeId && typeof doc.employeeId === "string") {
      employeeInfo = await Employee.findOne({ empId: doc.employeeId }, "name email department");
    }

    res.status(200).json({
      success: true,
      data: {
        ...doc.toObject(),
        employee: employeeInfo || null,
      },
    });
  } catch (err) {
    console.error("Error fetching document by ID:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// Update document metadata
exports.updateDocument = async (req, res) => {
  try {
    const { title, description } = req.body;
    const updated = await Document.findByIdAndUpdate(
      req.params.id,
      { title, description },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Document not found" });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });

    // Remove file from server
    fs.unlinkSync(path.resolve(doc.filePath));
    await doc.deleteOne();

    res.status(200).json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
///////////
exports.getDocumentsByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // ❌ Invalid ObjectId check
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID format"
      });
    }

    // ✅ Fetch documents using ObjectId
    const documents = await Document.find({
      employeeId: new mongoose.Types.ObjectId(employeeId)
    }).sort({ createdAt: -1 });

    if (!documents.length) {
      return res.status(404).json({
        success: false,
        message: "No documents found for this employee"
      });
    }

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });

  } catch (err) {
    console.error("Error fetching documents:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};