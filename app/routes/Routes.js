const express = require('express')
const router = express.Router();
const adminController = require("../controllers/adminController");
const authController = require("../controllers/auth.controller");
const hrController = require("../controllers/hrController");
const departmentController = require("../controllers/department");
const attendanceController = require("../controllers/attendance");
const authMiddleware = require("../middlewares/auth.middleware");
const leaveController = require("../controllers/leaveController");
const projectController = require("../controllers/project");
const taskController = require("../controllers/task");
const salaryController = require("../controllers/salary");
const payslipController = require("../controllers/payslip");
const announcementController = require("../controllers/announcement");



// Create HR
router.post("/create-hr", adminController.createHR);


// Login
router.post("/login", authController.login);

// Change password
router.post("/changepassword", authController.changePassword);


// Create employee
router.post("/create-employee", hrController.createEmployee);
router.get("/getemployees", hrController.getUsers);
router.get("/getemployee/:id", hrController.getUser);
router.put("/employee/:id", hrController.updateEmployee);
router.delete("/delete-employee/:id", hrController.deleteEmployee);


//// Attendance routes
router.post("/logout", attendanceController.logoutSession);
router.post("/break-start", attendanceController.startBreak);
router.post("/breakend", attendanceController.endBreak);
router.get("/live-hours", attendanceController.getLiveHours);
router.get("/getAllAttendance", attendanceController.getAllAttendance);
router.get("/getAttendanceById/:id", attendanceController.getAttendanceById);
router.delete("/deleteAttendanceById/:id", attendanceController.deleteAttendance);
router.post("/hr-update", attendanceController.hrUpdateAttendance);



//Leaves
router.post("/apply", leaveController.applyLeave);
router.get("/pending", leaveController.getPendingLeaves);
router.put("/update-status", leaveController.updateLeaveStatus);
router.get("/getleaveById/:id", leaveController.getLeaveById);
router.get("/employeeLeavesByEmpNumber/:empNumber", leaveController.getLeavesByEmpNumber);
router.get("/leave-calendar", leaveController.getLeaveByEmp);
router.get("/getLeavesByEmployee/:employeeId", leaveController.getLeavesByEmployeeId);
router.delete("/deleteLeave/:id", leaveController.deleteLeaveById);



const holidayController = require("../controllers/holiday");

// Route to generate weekends for a year
// Example: POST /holidays/generate/2026
// router.post("/generate/:year", holidayController.generateWeekends);

// Route to get all holidays
// Example: GET /holidays
router.get("/getHolidays", holidayController.getAllHolidays);
router.post("/createholidays", holidayController.addMultipleHolidays);
router.put("/updateholidays/:id", holidayController.updateHoliday);
router.delete("/deleteholidays/:id", holidayController.deleteHoliday);
router.post("/auto-weekends", holidayController.runAutoWeekend);


// Create a project
router.post("/addProject", projectController.createProject);
router.get("/getAllProjects", projectController.getAllProjects);
router.get("/getProjectById/:id", projectController.getProjectById);
router.put("/updateProjectById/:id", projectController.updateProject);
router.delete("/deleteProject/:id", projectController.deleteProject);




//tasks
router.post("/create-task", taskController.addTask);
router.put("/update-progress", taskController.updateTaskProgress);
router.get("/getprojectsById/:projectId", taskController.getTaskCount);//Manager view: tasks by project
router.get("/employee-day", taskController.getTasksByEmployeePerDay);// Employee view: tasks per day
router.delete("/delete/:taskId", taskController.deleteTask);



// Add employee with base salary
router.post("/add-employee", salaryController.addEmployee);
router.put("/increment-salaries", salaryController.incrementSalaries);
router.get("/payslips/:payslipId/download", salaryController.downloadPayslip);



// // Payslip 
router.get("/getPayslipsById/:employeeId", payslipController.getPayslipsByEmployee);



//Announcement
router.post("/addAnnouncement", announcementController.createAnnouncement);
router.get("/getBydepartment", announcementController.getAnnouncements);
router.get("/getAnnouncementAll", announcementController.getAllAnnouncements);
router.put("/updateAnnouncementById/:id", announcementController.updateAnnouncement);
router.delete("/deleteAnnouncementById/:id", announcementController.deleteAnnouncement);








// CRUD routes
router.post("/createDepartment", departmentController.createDepartment);
router.get("/getAllDepartments", departmentController.getDepartments);
router.get("/getDepartmentById/:id", departmentController.getDepartment);
router.put("/updateDepartment/:id", departmentController.updateDepartment);
router.delete("/deleteDepartment/:id", departmentController.deleteDepartment);





module.exports = router