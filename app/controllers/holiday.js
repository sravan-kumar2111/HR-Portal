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
////////////////////
const checkDayStatus = async (date, department) => {

  // Convert to IST properly
  const inputDate = new Date(date);

  const istDate = new Date(
    inputDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  // Normalize IST start & end
  const start = new Date(istDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(istDate);
  end.setHours(23, 59, 59, 999);

  // 1️⃣ Check Holiday (IST based)
  const holiday = await Holiday.findOne({
    date: { $gte: start, $lte: end }
  });

  if (holiday) {
    return {
      type: "HOLIDAY",
      message: holiday.holidayName
    };
  }

  // 2️⃣ Get day name in IST
  const dayName = istDate.toLocaleString("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata"
  });

  // 3️⃣ Check Week-Off
  if (department.weekOffDays.includes(dayName)) {
    return {
      type: "WEEKOFF",
      message: dayName
    };
  }

  return {
    type: "WORKING"
  };
};