require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");

const STUDENT_EMAIL = "1ga23is171@gat.ac.in";
const PASSWORD = "qwert123";

const randomSuffix = () => Math.random().toString(36).slice(2, 8);

const run = async () => {
  await connectDB();

  const teacherEmail = `teacher.${Date.now()}.${randomSuffix()}@college.edu`;
  const teacher = await User.create({
    name: `Teacher ${randomSuffix().toUpperCase()}`,
    email: teacherEmail,
    password: PASSWORD,
    role: "teacher",
    collegeId: `T-${Math.floor(Math.random() * 9000 + 1000)}`,
    department: "Computer Science",
  });

  let student = await User.findOne({ email: STUDENT_EMAIL });
  if (!student) {
    student = await User.create({
      name: "Student User",
      email: STUDENT_EMAIL,
      password: PASSWORD,
      role: "student",
      collegeId: "S-1001",
      department: "Information Science",
      semester: 6,
    });
  } else {
    student.name = student.name || "Student User";
    student.role = "student";
    student.password = PASSWORD;
    if (!student.collegeId) student.collegeId = "S-1001";
    if (!student.department) student.department = "Information Science";
    if (!student.semester) student.semester = 6;
    await student.save();
  }

  console.log("Seed completed successfully");
  console.log("Teacher credentials:");
  console.log(`Email: ${teacher.email}`);
  console.log(`Password: ${PASSWORD}`);
  console.log("Student credentials:");
  console.log(`Email: ${student.email}`);
  console.log(`Password: ${PASSWORD}`);

  process.exit(0);
};

run().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exit(1);
});
