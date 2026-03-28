const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/project");
const Employee = require("../models/user");

// --------------------------
// 1. Employee adds a new task8
// --------------------------
exports.addTask = async (req, res) => {
  try {
    const { projectId, employeeId, description, startTime, endTime, day } = req.body;

    // Basic fields validation
    if (!projectId || !employeeId || !description || !startTime || !endTime || !day) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Check if projectId and employeeId are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid projectId" });
    }
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: "Invalid employeeId" });
    }

    // Check if the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if the employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Store task
    const task = new Task({
      projectId,
      employeeId,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      day: new Date(day),
    });

    await task.save();
    res.status(201).json({ success: true, message: "Task added successfully", task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// --------------------------
// 2. Employee updates task progress
// --------------------------
exports.updateTaskProgress = async (req, res) => {
  try {
    const { taskId, progress, reason } = req.body;

    if (!taskId || !progress) {
      return res.status(400).json({ message: "Task ID and progress are required" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.progress = progress;

    // Reason required only if Not Completed / Pending
    if ((progress === "Not Completed" || progress === "Pending") && !reason) {
      return res.status(400).json({ message: "Reason is required for Not Completed or Pending tasks" });
    }

    if (reason) task.reason = reason;
    task.updatedAt = new Date();

    await task.save();
    res.status(200).json({ success: true, message: "Task progress updated", task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --------------------------
// 5. Delete a task
// --------------------------
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    if (!taskId) return res.status(400).json({ message: "Task ID is required" });

    const task = await Task.findByIdAndDelete(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// --------------------------
// 3. Get all tasks for a project
// --------------------------



// --------------------------
// Get task count, progress breakdown, and tasks data
// --------------------------
exports.getTaskCount = async (req, res) => {
  try {
    const { projectId, employeeId } = req.query;

    let filter = {};

    // ✅ Validate and filter by projectId
    if (projectId) {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ success: false, message: "Invalid projectId" });
      }
      filter.projectId = projectId;
    }

    // ✅ Validate and filter by employeeId (if passed as MongoDB _id)
    if (employeeId) {
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({ success: false, message: "Invalid employeeId" });
      }
      filter.employeeId = employeeId;
    }

    // Fetch tasks with filters applied
    const tasks = await Task.find(filter)
      .populate("employeeId", "name email department") // only relevant fields
      .populate("projectId", "name department")       // only relevant fields
      .sort({ day: 1, startTime: 1 });

    const count = tasks.length;

    // Breakdown by progress status
    const breakdown = tasks.reduce((acc, task) => {
      const key = task.progress || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count,
      breakdown,
      tasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get tasks strictly by projectId
exports.getTasksByProjectId = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid or missing projectId" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const tasks = await Task.find({ projectId })
      .populate("employeeId", "name email department")
      .populate("projectId", "name department")
      .sort({ day: 1, startTime: 1 });

    const count = tasks.length;

    const breakdown = tasks.reduce((acc, task) => {
      const key = task.progress || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      project: { id: project._id, name: project.name },
      count,
      breakdown,
      tasks
    });
  } catch (error) {
    console.error("Error fetching tasks by projectId:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};