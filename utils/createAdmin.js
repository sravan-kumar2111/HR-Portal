const User = require("../app/models/user");
const bcrypt = require("bcryptjs");

const createAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("✅ Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = new User({
      name: "Super Admin",
      email: "admin@test.com",
      password: hashedPassword,
      role: "admin"
    });

    await admin.save();

    console.log("🔥 Default Admin Created");
    console.log("📧 Email: admin@test.com");
    console.log("🔑 Password: Admin@123");

  } catch (error) {
    console.error("Admin creation error:", error.message);
  }
};

module.exports = createAdmin;