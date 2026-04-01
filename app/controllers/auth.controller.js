const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Attendance = require("../models/Attendance");
const Holiday = require("../models/Holiday");
const mongoose = require("mongoose");
const mailSender = require("../../utils/mailSender");
const moment = require("moment-timezone");

// // ---------------------------
// // Employee / HR Login
// // ---------------------------
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // ---------------------------
//     // 1️⃣ Find User
//     // ---------------------------
//     const user = await User.findOne({ email }).populate("department");

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // ---------------------------
//     // 2️⃣ Check Password
//     // ---------------------------
//     const match = await bcrypt.compare(password, user.password);

//     if (!match) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid password",
//       });
//     }

//     // ---------------------------
//     // 3️⃣ First Login Check
//     // ---------------------------
//     if (user.firstLogin) {
//       return res.json({
//         success: true,
//         message: "First login - change password required",
//         userId: user._id,
//         changePassword: true,
//       });
//     }

//     // ---------------------------
//     // 4️⃣ Attendance Logic
//     // ---------------------------
//     if (["employee", "hr", "manager"].includes(user.role)) {

//       // ✅ IST Time
//       const now = new Date(
//         new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
//       );

//       const loginTime = now;

//       // ✅ FIXED DATE (IST SAFE)
//       const todayStr = now.toLocaleDateString("en-CA", {
//         timeZone: "Asia/Kolkata",
//       });

//       const start = new Date(todayStr);
//       start.setHours(0, 0, 0, 0);

//       const end = new Date(todayStr);
//       end.setHours(23, 59, 59, 999);

//       // ---------------------------
//       // 🎉 Holiday Check
//       // ---------------------------
//       const holiday = await Holiday.findOne({
//         date: { $gte: start, $lte: end },
//       });

//       // ---------------------------
//       // 🛌 Week Off Check
//       // ---------------------------
//       const dayName = now.toLocaleString("en-US", {
//         weekday: "long",
//       });

//       const isWeekOff =
//         user.department?.weekOffDays?.includes(dayName) || false;

//       // ---------------------------
//       // 🔍 Find Today's Attendance
//       // ---------------------------
//       let attendance = await Attendance.findOne({
//         employeeId: user._id,
//         date: todayStr,
//       });

//       // ============================
//       // 🆕 FIRST LOGIN (CREATE)
//       // ============================
//       if (!attendance) {

//         let status;

//         // 🎉 Holiday
//         if (holiday) {
//           status = "Present (Holiday Work)";
//         }

//         // 🛌 Week Off
// else if (isWeekOff) {
//   status = "Present (WeekOff Work)";
// }

// // 🏢 Working Day
// else {
//   const cutoff = new Date(now);
//   cutoff.setHours(9, 40, 0, 0); // ⏰ 9:40 AM

//   if (loginTime <= cutoff) {
//     status = "Present";
//   } else {
//     status = "Absent"; // 🔥 After 9:40 → Absent
//   }
// }

//         // ✅ Create Attendance
//         attendance = new Attendance({
//           employeeId: user._id,
//           date: todayStr,
//           firstLogin: loginTime,
//           sessions: [{ loginTime }],
//           status,
//           isWeekOff,
//         });

//         await attendance.save();
//       }

//       // ============================
//       // 🔁 MULTIPLE LOGIN (UPDATE)
//       // ============================
//       else {
//         const lastSession =
//           attendance.sessions[attendance.sessions.length - 1];

//         // ❌ Prevent multiple login without logout
//        if (lastSession && !lastSession.logoutTime) {
//   // 🔁 Auto logout previous session
//   lastSession.logoutTime = loginTime;
// }

//         attendance.sessions.push({ loginTime });
//         await attendance.save();
//       }

//       // ---------------------------
//       // ⏱ Running Hours Calculation
//       // ---------------------------
//       let runningHours = 0;

//       if (attendance.firstLogin) {
//         let endTime = new Date();

//         const lastSession =
//           attendance.sessions[attendance.sessions.length - 1];

//         if (lastSession?.logoutTime) {
//           endTime = lastSession.logoutTime;
//         }

//         runningHours =
//           (endTime - attendance.firstLogin) / (1000 * 60 * 60);

//         // Subtract breaks if any
//         if (attendance.breaks?.length > 0) {
//           attendance.breaks.forEach((b) => {
//             if (b.start && b.end) {
//               runningHours -=
//                 (b.end - b.start) / (1000 * 60 * 60);
//             }
//           });
//         }

//         runningHours = parseFloat(runningHours.toFixed(2));
//       }

//       // ---------------------------
//       // 🔐 Generate Token
//       // ---------------------------
//       const token = jwt.sign(
//         {
//           id: user._id,
//           role: user.role,
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: "1d" }
//       );

//       // ---------------------------
//       // ✅ Response
//       // ---------------------------
//       return res.json({
//         success: true,
//         token,
//         role: user.role,
//         attendanceId: attendance._id,
//         date: todayStr,
//         attendanceStatus: attendance.status,
//         runningHours,
//       });
//     }

//     // ---------------------------
//     // 🧑‍💼 Admin Login (No Attendance)
//     // ---------------------------
//     const token = jwt.sign(
//       {
//         id: user._id,
//         role: user.role,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     return res.json({
//       success: true,
//       token,
//       role: user.role,
//     });

//   } catch (error) {
//     console.error("Login Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// ---------------------------
// Employee / HR Login
// ---------------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ---------------------------
    // 1️⃣ Find User
    // ---------------------------
    const user = await User.findOne({ email }).populate("department");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ---------------------------
    // 2️⃣ Check Password
    // ---------------------------
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    // ---------------------------
    // 3️⃣ First Login Check
    // ---------------------------
    if (user.firstLogin) {
      return res.json({
        success: true,
        message: "First login - change password required",
        userId: user._id,
        changePassword: true,
      });
    }

    // ---------------------------
    // 4️⃣ Attendance Logic
    // ---------------------------
    if (["employee", "hr", "manager"].includes(user.role)) {

      // ✅ ALWAYS USE UTC for DB
      const nowUTC = new Date();

      // ✅ IST using moment
      const nowIST = moment().tz("Asia/Kolkata");

      const loginTime = nowUTC; // store UTC
      const todayStr = nowIST.format("YYYY-MM-DD");

      const start = nowIST.clone().startOf("day").toDate();
      const end = nowIST.clone().endOf("day").toDate();

      // ---------------------------
      // 🎉 Holiday Check
      // ---------------------------
      const holiday = await Holiday.findOne({
        date: { $gte: start, $lte: end },
      });

      // ---------------------------
      // 🛌 Week Off Check
      // ---------------------------
      const dayName = nowIST.format("dddd");

      const isWeekOff =
        user.department?.weekOffDays?.includes(dayName) || false;

      // ---------------------------
      // 🔍 Find Today's Attendance
      // ---------------------------
      let attendance = await Attendance.findOne({
        employeeId: user._id,
        date: todayStr,
      });

      // ============================
      // 🆕 FIRST LOGIN (CREATE)
      // ============================
      if (!attendance) {

        let status;

        // 🎉 Holiday
        if (holiday) {
          status = "Present (Holiday Work)";
        }

        // 🛌 Week Off
        else if (isWeekOff) {
          status = "Present (WeekOff Work)";
        }

        // 🏢 Working Day
        else {
          const cutoff = nowIST.clone().set({
            hour: 9,
            minute: 40,
            second: 0,
          });

          if (nowIST.isSameOrBefore(cutoff)) {
            status = "Present";
          } else {
            status = "Absent";
          }
        }

        attendance = new Attendance({
          employeeId: user._id,
          date: todayStr,
          firstLogin: loginTime, // UTC
          sessions: [{ loginTime }],
          status,
          isWeekOff,
        });

        await attendance.save();
      }

      // ============================
      // 🔁 MULTIPLE LOGIN (UPDATE)
      // ============================
      else {
        const lastSession =
          attendance.sessions[attendance.sessions.length - 1];

        // Auto logout previous session
        if (lastSession && !lastSession.logoutTime) {
          lastSession.logoutTime = loginTime;
        }

        attendance.sessions.push({ loginTime });
        await attendance.save();
      }

      // ---------------------------
      // ⏱ Running Hours Calculation
      // ---------------------------
      let runningHours = 0;

      if (attendance.firstLogin) {
        let endTime = new Date();

        const lastSession =
          attendance.sessions[attendance.sessions.length - 1];

        if (lastSession?.logoutTime) {
          endTime = lastSession.logoutTime;
        }

        runningHours =
          (endTime - attendance.firstLogin) / (1000 * 60 * 60);

        // subtract breaks
        if (attendance.breaks?.length > 0) {
          attendance.breaks.forEach((b) => {
            if (b.start && b.end) {
              runningHours -=
                (b.end - b.start) / (1000 * 60 * 60);
            }
          });
        }

        runningHours = parseFloat(runningHours.toFixed(2));
      }

      // ---------------------------
      // 🔐 Generate Token
      // ---------------------------
      const token = jwt.sign(
        {
          id: user._id,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // ---------------------------
      // ✅ Response
      // ---------------------------
      return res.json({
        success: true,
        token,
        role: user.role,
        attendanceId: attendance._id,
        date: todayStr,
        attendanceStatus: attendance.status,
        runningHours,
      });
    }

    // ---------------------------
    // 🧑‍💼 Admin Login
    // ---------------------------
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      token,
      role: user.role,
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ---------------------------
// Change Password
// ---------------------------
exports.changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword)
      return res.status(400).json({ success: false, message: "New password and confirm password do not match" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Old password is incorrect" });

    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) return res.status(400).json({ success: false, message: "New password cannot be same as old password" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.firstLogin = false;
    user.passwordChangedAt = new Date();

    await user.save();
    res.json({ success: true, message: "Password changed successfully" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  // Only allow the predefined admin email
  if (email !== 'admin@example.com') {
    return res.status(401).json({ success: false, message: 'Invalid email' });
  }

  const admin = await User.findOne({ email });
  if (!admin) return res.status(401).json({ success: false, message: 'Admin not found' });

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(401).json({ success: false, message: 'Wrong password' });

  // Create JWT
  const token = jwt.sign({ id: admin._id, role: 'admin' }, 'YOUR_SECRET_KEY', { expiresIn: '1h' });

  res.json({ success: true, token, message: 'Admin logged in' });
};


// ---------------------------
// FORGOT PASSWORD (SEND OTP)
// ---------------------------
exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    email = email?.trim();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Generate 6 digit OTP
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Save as STRING (IMPORTANT)
    user.resetToken = String(resetToken);
    user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await user.save();

    // Email content
    const emailBody = `
      <h2>Password Reset</h2>
      <p>Your OTP is:</p>
      <h1>${resetToken}</h1>
      <p>Valid for 10 minutes</p>
    `;

    await mailSender(user.email, "Password Reset OTP", emailBody);

    return res.json({
      success: true,
      message: "OTP sent to email successfully"
    });

  } catch (error) {
    console.log("FORGOT ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------
// RESET PASSWORD
// ---------------------------
exports.resetPassword = async (req, res) => {
  try {
    let { email, token, newPassword, confirmPassword } = req.body;

    // Clean inputs (VERY IMPORTANT)
    email = email?.trim();
    token = token?.trim();

    if (!email || !token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Password match check
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found"
      });
    }

    // 🔥 1. CHECK EXPIRY FIRST
    if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Token expired"
      });
    }

    // 🔥 2. TOKEN MATCH (FIXED)
    const dbToken = String(user.resetToken).trim();
    const enteredToken = String(token).trim();

    console.log("DB TOKEN:", dbToken);
    console.log("ENTERED TOKEN:", enteredToken);

    if (dbToken !== enteredToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid token"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.firstLogin = false;

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful"
    });

  } catch (error) {
    console.log("RESET ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
