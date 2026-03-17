const Announcement = require("../models/Announcement");

// ==============================
// 1. CREATE Announcement
// ==============================
exports.createAnnouncement = async (req, res) => {
  try {
    let { title, message, departments, isForAll } = req.body;

    // Convert isForAll to Boolean
    isForAll = isForAll === true || isForAll === "true";

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    // Handle departments if provided as string (comma-separated)
    if (!isForAll) {
      if (typeof departments === "string") {
        departments = departments
          .split(",")
          .map((d) => d.trim())
          .filter((d) => d); // remove empty strings
      }

      if (!Array.isArray(departments) || departments.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Select at least one department",
        });
      }
    }

    const announcement = new Announcement({
      title,
      message,
      departments: isForAll ? [] : departments,
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
    const department = req.query.department;
    // OR: const department = req.user.department;

    if (!department) {
      return res.status(400).json({
        success: false,
        message: "Department is required",
      });
    }

    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { isForAll: true }, // ALL employees
        { departments: department }, // Specific department
      ],
    }).sort({ createdAt: -1 });

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
    const { id } = req.params; // Announcement ID
    let { title, message, departments, isForAll } = req.body;

    // Find existing announcement
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Convert isForAll to Boolean
    isForAll = isForAll === true || isForAll === "true";

    // Validate title and message
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    // Normalize departments if isForAll is false
    if (!isForAll) {
      if (typeof departments === "string") {
        departments = departments
          .split(",")
          .map((d) => d.trim())
          .filter((d) => d);
      }

      if (!Array.isArray(departments)) {
        departments = [];
      }

      if (departments.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Departments required if not for all",
        });
      }
    }

    // Update announcement fields
    announcement.title = title;
    announcement.message = message;
    announcement.isForAll = isForAll;
    announcement.departments = isForAll ? [] : departments;

    await announcement.save();

    res.status(200).json({
      success: true,
      message: isForAll
        ? "Announcement updated for ALL departments"
        : "Announcement updated for selected departments",
      data: announcement,
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