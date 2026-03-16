const Leave = require("../models/Leave");
const Holiday = require("../models/Holiday");
const LeaveBalance = require("../models/LeaveBalance");
const cron = require("node-cron");

const calculateDays = (start,end)=>{

const s = new Date(start);
const e = new Date(end);

const diff = e - s;

return Math.ceil(diff/(1000*60*60*24))+1;

};
//////applyLeave///////////
exports.applyLeave = async(req,res)=>{

try{

const { employeeId, empNumber, leaveType, startDate, endDate, reason } = req.body;

if(!employeeId || !empNumber || !leaveType || !startDate || !endDate){

return res.status(400).json({
message:"All fields required"
});

}

if(new Date(startDate) > new Date(endDate)){

return res.json({
message:"Invalid Date Range"
});

}

const overlap = await Leave.findOne({

employeeId,
empNumber,

status:{ $ne:"rejected" },

$or:[
{
startDate:{ $lte:endDate },
endDate:{ $gte:startDate }
}
]

});

if(overlap){

return res.json({
message:"Leave already applied in these dates"
});

}

let totalDays = calculateDays(startDate,endDate);

const holidays = await Holiday.find({
date:{
$gte:startDate,
$lte:endDate
}
});

totalDays = totalDays - holidays.length;

const leave = await Leave.create({

employeeId,
empNumber,
leaveType,
startDate,
endDate,
totalDays,
reason,
status:"pending"

});

res.json({
message:"Leave applied successfully",
leave
});

}catch(err){

res.status(500).json({
message:err.message
});

}

};
//////////getPendingLeaves///////
exports.getPendingLeaves = async(req,res)=>{

try{

const leaves = await Leave.find({
status:"pending"
});

res.json(leaves);

}catch(err){

res.status(500).json({
message:err.message
});

}

};
/////////updateLeaveStatus////////
exports.updateLeaveStatus = async (req, res) => {

  try {

    const { leaveId, status } = req.body;

    // Validate request
    if (!leaveId || !status) {
      return res.status(400).json({
        message: "leaveId and status required"
      });
    }

    // Find Leave
    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        message: "Leave not found"
      });
    }

    // Update Leave Status
    leave.status = status;
    await leave.save();


    // Only deduct balance if approved
    if (status === "approved") {

      let balance = await LeaveBalance.findOne({
        employeeId: leave.employeeId
      });

      // Auto create LeaveBalance if not exists
      if (!balance) {

        balance = await LeaveBalance.create({
          employeeId: leave.employeeId,
          empNumber: leave.empNumber,
          sickLeave: 0,
          casualLeave: 0,
          earnedLeave: 0,
          year: new Date().getFullYear()
        });

      }

      // Deduct Sick Leave
      if (leave.leaveType === "sick") {

        if (balance.sickLeave < leave.totalDays) {
          return res.json({
            message: "Not enough Sick Leave balance"
          });
        }

        balance.sickLeave -= leave.totalDays;
      }

      // Deduct Casual Leave
      if (leave.leaveType === "casual") {

        if (balance.casualLeave < leave.totalDays) {
          return res.json({
            message: "Not enough Casual Leave balance"
          });
        }

        balance.casualLeave -= leave.totalDays;
      }

      // Deduct Earned Leave
      if (leave.leaveType === "earned") {

        if (balance.earnedLeave < leave.totalDays) {
          return res.json({
            message: "Not enough Earned Leave balance"
          });
        }

        balance.earnedLeave -= leave.totalDays;
      }

      await balance.save();
    }

    res.json({
      success: true,
      message: "Leave status updated successfully",
      leave
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};
///////////getLeaveById////////
// exports.getLeaveById = async(req,res)=>{

// try{

// const leave = await Leave.findById(req.params.id);

// res.json(leave);

// }catch(err){

// res.status(500).json({
// message:err.message
// });

// }

// };
exports.getLeaveById = async (req, res) => {

  try {

    const leaveId = req.params.id;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        message: "Leave not found"
      });
    }

    res.json(leave);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};
/////////getLeavesByEmpNumber///////
exports.getLeavesByEmpNumber = async(req,res)=>{

try{

const empNumber = req.params.empNumber;

const leaves = await Leave.find({empNumber});

res.json(leaves);

}catch(err){

res.status(500).json({
message:err.message
});

}

};
///////getLeavesByEmployeeId////////
exports.getLeavesByEmployeeId = async (req, res) => {

  try {

    const employeeId = req.params.employeeId;

    const leaves = await Leave.find({ employeeId }).sort({ createdAt: -1 });

    res.json({
      count: leaves.length,
      data: leaves
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};
/////////getLeaveCalendar////////
exports.getLeaveByEmp = async (req, res) => {
  try {
    const empNumber = req.query.empNumber;
    const month = req.query.month ? parseInt(req.query.month) : null; // 1-12
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    if (!empNumber) {
      return res.status(400).json({ message: "empNumber is required" });
    }

    let monthLeaves = [];
    let yearLeaves = [];

    // Year start/end
    const yearStart = new Date(year, 0, 1, 0, 0, 0);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    // Fetch year leaves
    yearLeaves = await Leave.find({
      empNumber,
      startDate: { $lte: yearEnd },
      endDate: { $gte: yearStart }
    }).sort({ startDate: 1 });

    // If month is provided, fetch month leaves
    if (month) {
      const monthStart = new Date(year, month - 1, 1, 0, 0, 0);
      const monthEnd = new Date(year, month, 0, 23, 59, 59);

      monthLeaves = await Leave.find({
        empNumber,
        startDate: { $lte: monthEnd },
        endDate: { $gte: monthStart }
      }).sort({ startDate: 1 });
    }

    return res.json({
      success: true,
      empNumber,
      month: month || "all",
      year,
      monthLeaveCount: monthLeaves.length,
      yearLeaveCount: yearLeaves.length,
      monthLeaves,
      yearLeaves
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
//////// deleteLeaveById ////////
exports.deleteLeaveById = async (req, res) => {

  try {

    const leaveId = req.params.id;

    const leave = await Leave.findByIdAndDelete(leaveId);

    if (!leave) {
      return res.status(404).json({
        message: "Leave not found"
      });
    }

    res.json({
      message: "Leave deleted successfully"
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};
