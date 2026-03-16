const Project = require("../models/project");

// --------------------------
// Create a new project
// --------------------------
exports.createProject = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Project name is required" });

    const project = new Project({ name });
    await project.save();

    res.status(201).json({ success: true, message: "Project created", project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --------------------------
// Get all projects
// --------------------------
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --------------------------
// Get a single project by ID
// --------------------------
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --------------------------
// Update a project by ID
// --------------------------
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: "Project name is required" });

    const project = await Project.findByIdAndUpdate(
      id,
      { name, updatedAt: Date.now() },
      { new: true }
    );

    if (!project) return res.status(404).json({ message: "Project not found" });

    res.status(200).json({ success: true, message: "Project updated", project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --------------------------
// Delete a project by ID
// --------------------------
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);

    if (!project) return res.status(404).json({ message: "Project not found" });

    res.status(200).json({ success: true, message: "Project deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};