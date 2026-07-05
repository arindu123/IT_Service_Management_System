const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/it_service_management";

const adminData = {
  name: "Admin User",
  email: "admin@gmail.com",
  employeeId: "IT-ADMIN-001",
  password: "123456",
  role: "head_of_it",
  department: "IT",
  designation: "Head of IT",
  phone: "0700000000",
  officeLocation: "IT Division",
};

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB at ${MONGO_URI}`);

    const existing = await User.findOne({ email: adminData.email });
    if (existing) {
      console.log("Admin user already exists:", existing.email);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    const user = await User.create({
      ...adminData,
      password: hashedPassword,
    });

    console.log("Admin user created successfully:", user.email);
    console.log("Password:", adminData.password);
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error.message);
    process.exit(1);
  }
};

createAdmin();
