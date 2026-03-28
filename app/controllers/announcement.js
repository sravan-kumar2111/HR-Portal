const Announcement = require("../models/Announcement");
const mongoose = require("mongoose");
const Department = require("../models/Department");
// Helper: Normalize Departments
// ==============================
const normalizeDepartments = (departments) => {
  if (!departments) return [];

  // If string → convert to array
  if (typeof departments === "string") {
    return departments
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);
  }

  // If already array
  if (Array.isArray(departments)) {
    return departments.map((id) => id.toString().trim());
  }

  return [];
};

// ==============================
// 1. CREATE Announcement
// ==============================
exports.createAnnouncement = async (req, res) => {
  try {
    let { title, message, departments, isForAll } = req.body;

    // Convert boolean
    isForAll = isForAll === true || isForAll === "true";

    // Normalize departments
    departments = normalizeDepartments(departments);

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    if (!isForAll && departments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Department IDs are required",
      });
    }

    // ✅ Validate ObjectIds
    const validIds = departments.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (!isForAll && validIds.length !== departments.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID format",
      });
    }

    // ✅ Check if departments exist
    if (!isForAll) {
      const foundDepartments = await Department.find({
        _id: { $in: validIds },
      });

      if (foundDepartments.length !== validIds.length) {
        return res.status(400).json({
          success: false,
          message: "Some department IDs not found",
        });
      }
    }

    const announcement = new Announcement({
      title,
      message,
      departments: isForAll ? [] : validIds,
      isForAll,
    });

    await announcement.save();

    res.status(201).json({
      success: true,
      message: isForAll
        ? "Announcement sent to ALL departments"
        : "Announcement sent to selected departments",
      data: announcement,
    });
  } catch (error) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ==============================
// 2. GET Announcements (Employee)
// ==============================
exports.getAnnouncements = async (req, res) => {
  try {
    const departmentId = req.query.departmentId;
    // OR: req.user.departmentId

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "Department ID is required",
      });
    }

    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { isForAll: true },
        { departments: departmentId }, // match ObjectId
      ],
    })
      .populate("departments", "name") // optional
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};



// ==============================
// 3. GET ALL (Admin)
// ==============================
exports.getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};



// ==============================
// 4. UPDATE Announcement
// ==============================
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, message, departments, isForAll } = req.body;

    // ✅ Validate Announcement ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Announcement ID",
      });
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // ✅ Convert boolean
    isForAll = isForAll === true || isForAll === "true";

    // ✅ Convert departments (IMPORTANT for x-www-form-urlencoded)
    if (typeof departments === "string") {
      departments = departments
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);
    }

    // Ensure array
    if (!Array.isArray(departments)) {
      departments = [];
    }

    // ✅ Validate title & message
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    // ✅ Validate departments if not for all
    if (!isForAll && departments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Department IDs required",
      });
    }

    // ✅ Validate ObjectId format
    const validDeptIds = departments.filter((deptId) =>
      mongoose.Types.ObjectId.isValid(deptId)
    );

    if (!isForAll && validDeptIds.length !== departments.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID format",
      });
    }

    // ✅ Check if departments exist in DB
    if (!isForAll) {
      const existingDepartments = await Department.find({
        _id: { $in: validDeptIds },
      });

      if (existingDepartments.length !== validDeptIds.length) {
        return res.status(400).json({
          success: false,
          message: "Some department IDs not found",
        });
      }
    }

    // ✅ Update fields
    announcement.title = title;
    announcement.message = message;
    announcement.isForAll = isForAll;
    announcement.departments = isForAll ? [] : validDeptIds;

    await announcement.save();

    res.status(200).json({
      success: true,
      message: isForAll
        ? "Announcement updated for ALL departments"
        : "Announcement updated for selected departments",
      data: announcement,
    });

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
// ==============================
// 5. DELETE Announcement
// ==============================
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    await announcement.deleteOne();

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};