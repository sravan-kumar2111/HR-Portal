const Department = require("../models/Department");
const User = require("../models/user");
const bcrypt = require("bcryptjs");   
const mongoose = require("mongoose");  

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
// GET ALL DEPARTMENTS WITH DYNAMIC EMPLOYEE COUNT
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.aggregate([
      {
        $lookup: {
          from: "users",          // MongoDB collection name for employees
          localField: "_id",      // Department _id
          foreignField: "department", // Employee.department field
          as: "employees"
        }
      },
      {
        $addFields: { employeeCount: { $size: "$employees" } }
      },
      {
        $project: { employees: 0 } // remove the full employees array
      }
    ]);

    res.json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// GET SINGLE DEPARTMENT WITH EMPLOYEE COUNT

exports.getDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;

    // Aggregate to get the department and employee count
    const result = await Department.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(departmentId) } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "department",
          as: "employees"
        }
      },
      {
        $addFields: { employeeCount: { $size: "$employees" } }
      },
      {
        $project: { employees: 0 }
      }
    ]);

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    res.json({
      success: true,
      department: result[0]
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