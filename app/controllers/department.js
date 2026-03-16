const Department = require("../models/Department");

// CREATE DEPARTMENT
exports.createDepartment = async (req, res) => {
  try {
    const { departmentName, managerName, description } = req.body;

    if (!departmentName || !managerName) {
      return res.status(400).json({
        success: false,
        message: "Department name and manager name are required"
      });
    }

    const existing = await Department.findOne({ departmentName });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Department already exists"
      });
    }

    const department = new Department({ departmentName, managerName, description });
    await department.save();

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      department
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET ALL DEPARTMENTS
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json({
      success: true,
      departments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET SINGLE DEPARTMENT
exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }
    res.json({
      success: true,
      department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE DEPARTMENT
exports.updateDepartment = async (req, res) => {
  try {
    const updatedData = { ...req.body };
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    res.json({
      success: true,
      message: "Department updated successfully",
      department
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE DEPARTMENT
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    res.json({
      success: true,
      message: "Department deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};