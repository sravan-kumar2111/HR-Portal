const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// ✅ Allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf", // PDF
    "image/jpeg",      // JPG
    "image/png",       // PNG
    "image/jpg",       // JPG
    "application/msword", // DOC
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // DOCX
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, Image, and Word documents are allowed"), false);
  }
};

// ✅ Optional: file size limit (5MB)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload;