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

async function generateWeekends(year) {
  const weekends = [];

  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day, 0, 0, 0); // local midnight
      const dayOfWeek = date.getDay(); // Sunday=0, Saturday=6

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Check for duplicates by day only
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

        const exists = await Holiday.findOne({
          date: { $gte: start, $lte: end },
          holidayName: dayOfWeek === 0 ? "Sunday" : "Saturday"
        });

        if (!exists) {
          weekends.push({
            holidayName: dayOfWeek === 0 ? "Sunday" : "Saturday",
            date
          });
        }
      }
    }
  }

  if (weekends.length > 0) {
    await Holiday.insertMany(weekends);
    console.log(`${weekends.length} weekend holidays generated for ${year}`);
  } else {
    console.log(`Weekends for ${year} already exist`);
  }
}

// Generate weekends for current year
generateWeekends(new Date().getFullYear());
// ---------------------------
// Generate Weekends for a given year (Controller)
// ---------------------------
exports.generateWeekends = async (req, res) => {
  try {
    const year = req.body.year || new Date().getFullYear(); // default: current year
    const weekends = [];

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dayOfWeek = dateObj.getDay(); // Sunday=0, Saturday=6

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          // Set time to midnight local
          const localDate = new Date(year, month, day, 0, 0, 0, 0);

          // Check if holiday already exists
          const exists = await Holiday.findOne({ date: localDate });
          if (!exists) {
            weekends.push({
              holidayName: dayOfWeek === 0 ? "Sunday" : "Saturday",
              date: localDate,
            });
          }
        }
      }
    }

    if (weekends.length > 0) {
      await Holiday.insertMany(weekends);
      return res.json({
        success: true,
        message: `${weekends.length} weekend holidays generated for ${year}`,
        weekends,
      });
    } else {
      return res.json({
        success: true,
        message: `Weekends for ${year} already exist`,
        weekends: [],
      });
    }

  } catch (err) {
    console.error("Error generating weekends:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};