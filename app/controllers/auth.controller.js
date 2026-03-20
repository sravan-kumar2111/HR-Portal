const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Attendance = require("../models/Attendance");
const Holiday = require("../models/Holiday");
const mongoose = require("mongoose");
const mailSender = require("../../utils/mailSender");

// // ---------------------------
// // Employee Login
// // ---------------------------
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ success: false, message: "User not found" });

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(400).json({ success: false, message: "Invalid password" });

//     // First login: require password change
//     if (user.firstLogin) {
//       return res.json({
//         success: true,
//         message: "First login - change password required",
//         userId: user._id,
//         changePassword: true
//       });
//     }

//     // ---------------------------
//     // Attendance: record first login & calculate running hours
//     // ---------------------------
//     if (user.role === "employee") {
//       const now = new Date();
//       const today = new Date().toISOString().split("T")[0];

//       let attendance = await Attendance.findOne({ employeeId: user._id, date: today });

//       if (!attendance) {
//         // Office start 9:30, absent if login after 9:40
//         const limit = new Date();
//         limit.setHours(9, 40, 0, 0);

//         const status = now > limit ? "absent" : "present";

//         attendance = new Attendance({
//           employeeId: user._id,
//           date: today,
//           firstLogin: now,
//           sessions: [{ loginTime: now }],
//           status
//         });

//         await attendance.save();
//       }

//       // Calculate running hours if employee already logged in
//       let runningHours = 0;
//       if (attendance.firstLogin) {
//         const endTime = attendance.lastLogout || new Date();
//         runningHours = (endTime - attendance.firstLogin) / (1000 * 60 * 60); // hours
//         // Subtract breaks
//         attendance.breaks.forEach(b => {
//           if (b.start && b.end) runningHours -= (b.end - b.start) / (1000 * 60 * 60);
//         });
//         runningHours = parseFloat(runningHours.toFixed(2));
//       }

//       res.json({
//         success: true,
//         token: jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" }),
//         role: user.role,
//         attendanceStatus: attendance.status,
//         runningHours
//       });

//     } else {
//       // Non-employee login
//       const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
//       res.json({ success: true, token, role: user.role });
//     }

//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ---------------------------
// // Employee Login with Holiday/Weekend Logic
// // ---------------------------
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // ---------------------------
//     // 1. Find User
//     // ---------------------------
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ success: false, message: "User not found" });

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(400).json({ success: false, message: "Invalid password" });

//     // ---------------------------
//     // 2. First Login: require password change
//     // ---------------------------
//     if (user.firstLogin) {
//       return res.json({
//         success: true,
//         message: "First login - change password required",
//         userId: user._id,
//         changePassword: true
//       });
//     }

//     // ---------------------------
//     // 3. Attendance for Employees
//     // ---------------------------
//     if (user.role === "employee") {
//       const now = new Date();
//       const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

//       // 3a. Check if today is a holiday/weekend
//       const holiday = await Holiday.findOne({ date: todayStr });

//       // 3b. Determine attendance status
//       let status = "present"; // default if employee logs in
//       if (!holiday) {
//         // Not a holiday, check office start time
//         const limit = new Date();
//         limit.setHours(9, 40, 0, 0); // 9:40 AM limit
//         status = now > limit ? "absent" : "present";
//       } else {
//         // Holiday or weekend, login overrides → present
//         status = "present";
//       }

//       // 3c. Create or update today's attendance
//       let attendance = await Attendance.findOne({ employeeId: user._id, date: todayStr });

//       if (!attendance) {
//         attendance = new Attendance({
//           employeeId: user._id,
//           date: todayStr,
//           firstLogin: now,
//           sessions: [{ loginTime: now }],
//           status
//         });
//         await attendance.save();
//       }

//       // 3d. Calculate running hours if employee already logged in
//       let runningHours = 0;
//       if (attendance.firstLogin) {
//         const endTime = attendance.lastLogout || new Date();
//         runningHours = (endTime - attendance.firstLogin) / (1000 * 60 * 60); // hours

//         // Subtract break hours
//         attendance.breaks.forEach(b => {
//           if (b.start && b.end) runningHours -= (b.end - b.start) / (1000 * 60 * 60);
//         });

//         runningHours = parseFloat(runningHours.toFixed(2));
//       }

//       // 3e. Return response with JWT token and attendance info
//       return res.json({
//         success: true,
//         token: jwt.sign(
//           { id: user._id, role: user.role },
//           process.env.JWT_SECRET,
//           { expiresIn: "1d" }
//         ),
//         role: user.role,
//         attendanceStatus: attendance.status,
//         runningHours
//       });

//     } else {
//       // ---------------------------
//       // Non-employee login
//       // ---------------------------
//       const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
//       return res.json({ success: true, token, role: user.role });
//     }

//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };





// ---------------------------
// Employee Login
// ---------------------------
// exports.login = async (req, res) => {

//   try {

//     const { email, password } = req.body;

//     // ---------------------------
//     // 1️⃣ Find User
//     // ---------------------------
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     const match = await bcrypt.compare(password, user.password);

//     if (!match) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid password"
//       });
//     }

//     // ---------------------------
//     // 2️⃣ First Login Check
//     // ---------------------------
//     if (user.firstLogin) {
//       return res.json({
//         success: true,
//         message: "First login - change password required",
//         userId: user._id,
//         changePassword: true
//       });
//     }

//     // ---------------------------
//     // 3️⃣ Attendance for Employees
//     // ---------------------------
//     if (user.role === "employee") {

//       const now = new Date();

//       // 🇮🇳 India Date
//       const todayStr = new Date().toLocaleDateString("en-CA", {
//         timeZone: "Asia/Kolkata"
//       });

//       // ---------------------------
//       // Check Holiday
//       // ---------------------------
//       const holiday = await Holiday.findOne({ date: todayStr });

//       let status = "Present";

//       if (!holiday) {

//         // Office login limit (9:40 AM IST)
//         const limit = new Date();
//         limit.setHours(9, 40, 0, 0);

//         if (now > limit) {
//           status = "Absent";
//         }

//       }

//       // ---------------------------
//       // Find Today's Attendance
//       // ---------------------------
//       let attendance = await Attendance.findOne({
//         employeeId: user._id,
//         date: todayStr
//       });

//       // ---------------------------
//       // First Login Today
//       // ---------------------------
//       if (!attendance) {

//         attendance = new Attendance({
//           employeeId: user._id,
//           date: todayStr,
//           firstLogin: now,
//           sessions: [{
//             loginTime: now
//           }],
//           status
//         });

//         await attendance.save();

//       } else {

//         // Multiple login sessions
//         attendance.sessions.push({
//           loginTime: now
//         });

//         await attendance.save();
//       }

//       // ---------------------------
//       // Calculate Running Hours
//       // ---------------------------
//       let runningHours = 0;

//       if (attendance.firstLogin) {

//         const endTime = attendance.lastLogout || new Date();

//         runningHours = (endTime - attendance.firstLogin) / (1000 * 60 * 60);

//         // subtract breaks
//         if (attendance.breaks && attendance.breaks.length > 0) {

//           attendance.breaks.forEach(b => {
//             if (b.start && b.end) {
//               runningHours -= (b.end - b.start) / (1000 * 60 * 60);
//             }
//           });

//         }

//         runningHours = parseFloat(runningHours.toFixed(2));
//       }

//       // ---------------------------
//       // Generate JWT Token
//       // ---------------------------
//       const token = jwt.sign(
//         {
//           id: user._id,
//           role: user.role
//         },
//         process.env.JWT_SECRET,
//         {
//           expiresIn: "1d"
//         }
//       );

//       // ---------------------------
//       // Response
//       // ---------------------------
//       return res.json({
//         success: true,
//         token,
//         role: user.role,
//         attendanceId: attendance._id,
//         date: todayStr,
//         attendanceStatus: attendance.status,
//         runningHours
//       });

//     }

//     // ---------------------------
//     // Non Employee Login
//     // ---------------------------
//     const token = jwt.sign(
//       {
//         id: user._id,
//         role: user.role
//       },
//       process.env.JWT_SECRET,
//       {
//         expiresIn: "1d"
//       }
//     );

//     return res.json({
//       success: true,
//       token,
//       role: user.role
//     });

//   } catch (error) {

//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });

//   }

// };




// ---------------------------
// Employee Login
// ---------------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ---------------------------
    // 1️⃣ Find User + Department
    // ---------------------------
    const user = await User.findOne({ email }).populate("department");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ---------------------------
    // 2️⃣ Check Password
    // ---------------------------
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid password"
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
        changePassword: true
      });
    }

    // ---------------------------
    // 4️⃣ Employee Attendance Logic
    // ---------------------------
    if (user.role === "employee") {

      const now = new Date();

      // 🇮🇳 IST Date (YYYY-MM-DD)
      const todayStr = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata"
      });

      const start = new Date(todayStr);
      start.setHours(0, 0, 0, 0);

      const end = new Date(todayStr);
      end.setHours(23, 59, 59, 999);

      // ---------------------------
      // ✅ Check Holiday
      // ---------------------------
      const holiday = await Holiday.findOne({
        date: { $gte: start, $lte: end }
      });

      // ---------------------------
      // ✅ Check Week-Off
      // ---------------------------
      const dayName = new Date().toLocaleString("en-US", {
        weekday: "long",
        timeZone: "Asia/Kolkata"
      });

      const isWeekOff =
        user.department &&
        user.department.weekOffs &&
        user.department.weekOffs.includes(dayName);

      // ---------------------------
      // Decide Attendance Status
      // ---------------------------
      let status = "Present";

      if (holiday) {
        status = "Holiday";
      } else if (isWeekOff) {
        status = "Week Off";
      } else {
        // Late login rule (9:40 AM IST)
        const limit = new Date();
        limit.setHours(9, 40, 0, 0);

        if (now > limit) {
          status = "Absent";
        }
      }

      // ---------------------------
      // Find Today's Attendance
      // ---------------------------
      let attendance = await Attendance.findOne({
        employeeId: user._id,
        date: todayStr
      });

      // ---------------------------
      // First Login Today
      // ---------------------------
      if (!attendance) {

        attendance = new Attendance({
          employeeId: user._id,
          date: todayStr,
          firstLogin: now,
          sessions: [
            {
              loginTime: now
            }
          ],
          status
        });

        await attendance.save();

      } else {

        // Add new session
        attendance.sessions.push({
          loginTime: now
        });

        await attendance.save();
      }

      // ---------------------------
      // Calculate Running Hours
      // ---------------------------
      let runningHours = 0;

      if (attendance.firstLogin) {

        const endTime = attendance.lastLogout || new Date();

        runningHours = (endTime - attendance.firstLogin) / (1000 * 60 * 60);

        // subtract breaks
        if (attendance.breaks && attendance.breaks.length > 0) {
          attendance.breaks.forEach(b => {
            if (b.start && b.end) {
              runningHours -= (b.end - b.start) / (1000 * 60 * 60);
            }
          });
        }

        runningHours = parseFloat(runningHours.toFixed(2));
      }

      // ---------------------------
      // Generate Token
      // ---------------------------
      const token = jwt.sign(
        {
          id: user._id,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // ---------------------------
      // Response
      // ---------------------------
      return res.json({
        success: true,
        token,
        role: user.role,
        attendanceId: attendance._id,
        date: todayStr,
        attendanceStatus: attendance.status,
        runningHours
      });
    }

    // ---------------------------
    // 5️⃣ Admin / HR Login
    // ---------------------------
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      token,
      role: user.role
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
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
