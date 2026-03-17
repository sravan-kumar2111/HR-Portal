const Holiday = require("../models/Holiday");

// ------------- Add Multiple Holidays at Once -------------
exports.addMultipleHolidays = async (req, res) => {
  try {
    const { holidays } = req.body; 
    // holidays = [{ holidayName: "Diwali", date: "2026-11-04" }, { holidayName: "New Year", date: "2026-01-01" }, ...]

    if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
      return res.status(400).json({ success: false, message: "Holidays array is required" });
    }

    const newHolidays = [];

    for (const h of holidays) {
      const { holidayName, date } = h;

      if (!holidayName || !date) continue; // skip invalid entries

      // Check if holiday already exists
      const existing = await Holiday.findOne({ date: new Date(date) });
      if (existing) continue; // skip duplicates

      newHolidays.push({ holidayName, date });
    }

    if (newHolidays.length === 0) {
      return res.status(400).json({ success: false, message: "No new holidays to add" });
    }

    // Bulk insert
    const inserted = await Holiday.insertMany(newHolidays);

    res.status(201).json({
      success: true,
      message: `${inserted.length} holidays added successfully`,
      holidays: inserted
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ------------- Get All Holidays -------------
exports.getAllHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ success: true, holidays });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------- Update a Holiday -------------
// ------------- Update a Holiday (works with JSON or x-www-form-urlencoded) -------------
exports.updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    // Support both JSON and x-www-form-urlencoded
    const holidayName = req.body.holidayName || req.body.holiday_name;
    const date = req.body.date;

    const holiday = await Holiday.findById(id);
    if (!holiday)
      return res.status(404).json({ success: false, message: "Holiday not found" });

    if (holidayName) holiday.holidayName = holidayName;
    if (date) holiday.date = date;

    await holiday.save();

    res.json({ success: true, message: "Holiday updated", holiday });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------- Delete a Holiday -------------
exports.deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    const holiday = await Holiday.findById(id);
    if (!holiday) return res.status(404).json({ success: false, message: "Holiday not found" });

    await holiday.deleteOne();
    res.json({ success: true, message: "Holiday deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// // ------------- Fetch Holidays for a Year (Calendar view) -------------
// exports.getHolidaysByYear = async (req, res) => {
//   try {
//     const { year } = req.params;

//     const start = new Date(`${year}-01-01`);
//     const end = new Date(`${year}-12-31`);

//     const holidays = await Holiday.find({ date: { $gte: start, $lte: end } }).sort({ date: 1 });

//     res.json({ success: true, holidays });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };


// // Generate weekends for a specific year
// async function generateWeekends(year) {
//   // Check if weekends for this year already exist
//   const existing = await Holiday.findOne({
//     date: {
//       $gte: new Date(`${year}-01-01`),
//       $lte: new Date(`${year}-12-31`)
//     },
//     holidayName: { $in: ["Saturday", "Sunday"] }
//   });

//   if (existing) {
//     console.log(`Weekends for ${year} already generated.`);
//     return;
//   }

//   const weekends = [];

//   for (let month = 0; month < 12; month++) {
//     const daysInMonth = new Date(year, month + 1, 0).getDate();

//     for (let day = 1; day <= daysInMonth; day++) {
//       const date = new Date(year, month, day);
//       const dayOfWeek = date.getDay(); // Sunday=0, Saturday=6

//       if (dayOfWeek === 0 || dayOfWeek === 6) {
//         const holidayName = dayOfWeek === 0 ? "Sunday" : "Saturday";
//         weekends.push({ holidayName, date });
//       }
//     }
//   }

//   // Bulk insert weekends
//   await Holiday.insertMany(weekends);
//   console.log(`Weekends for ${year} generated successfully!`);
// }

// / ---------------------------
// Trigger Auto Weekend (POSTMAN)
// // ---------------------------
// exports.runAutoWeekend = async (req, res) => {
//   try {
//     const year = new Date().getFullYear();
//     const weekends = [];

//     for (let month = 0; month < 12; month++) {
//       const daysInMonth = new Date(year, month + 1, 0).getDate();

//       for (let day = 1; day <= daysInMonth; day++) {
//         const dateObj = new Date(year, month, day);
//         const dayOfWeek = dateObj.getDay();

//         if (dayOfWeek === 0 || dayOfWeek === 6) {
//           const istDate = new Date(dateObj).toLocaleDateString("en-CA", {
//             timeZone: "Asia/Kolkata"
//           });

//           weekends.push({
//             holidayName: dayOfWeek === 0 ? "Sunday" : "Saturday",
//             date: istDate
//           });
//         }
//       }
//     }

//     const result = await Holiday.insertMany(weekends, { ordered: false });

//     return res.json({
//       success: true,
//       message: `${result.length} weekends generated`,
//       data: result
//     });

//   } catch (err) {
//     // duplicate case (already exists)
//     return res.json({
//       success: true,
//       message: "All weekends already exist",
//       data: []
//     });
//   }
// };
// ---------------------------
// Generate Weekends (Custom Year)
// ---------------------------
exports.runAutoWeekend = async (req, res) => {
  try {

    // 👉 get year from body (default = current year)
    const inputYear = req.body.year || new Date().getFullYear();

    // 👉 generate for selected year + next year
    const years = [inputYear, inputYear + 1];

    let allInserted = [];

    for (const year of years) {

      const weekends = [];

      for (let month = 0; month < 12; month++) {

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {

          const dateObj = new Date(year, month, day);
          const dayOfWeek = dateObj.getDay();

          if (dayOfWeek === 0 || dayOfWeek === 6) {

            const istDate = new Date(dateObj).toLocaleDateString("en-CA", {
              timeZone: "Asia/Kolkata"
            });

            weekends.push({
              holidayName: dayOfWeek === 0 ? "Sunday" : "Saturday",
              date: istDate
            });
          }
        }
      }

      const inserted = await Holiday.insertMany(weekends, { ordered: false });

      allInserted = allInserted.concat(inserted);
    }

    return res.json({
      success: true,
      message: allInserted.length
        ? `${allInserted.length} weekends generated for ${inputYear} & ${inputYear + 1}`
        : "All weekends already exist",
      data: allInserted
    });

  } catch (err) {

    return res.json({
      success: true,
      message: "All weekends already exist",
      data: []
    });

  }
};