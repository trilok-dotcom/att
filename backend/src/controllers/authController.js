const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { generateToken } = require("../utils/token");

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, collegeId, department, semester } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: role || "student",
    collegeId,
    department,
    semester,
  });

  return res.status(201).json({
    token: generateToken(user._id, user.role),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeId: user.collegeId,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (user.role === "student") {
    // Note: Student name validation removed to improve login reliability
  }

  return res.json({
    token: generateToken(user._id, user.role),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeId: user.collegeId,
    },
  });
});

const getMe = asyncHandler(async (req, res) => {
  return res.json(req.user);
});

const getAllStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: "student" }).select("name email collegeId department semester");
  return res.json(students);
});

module.exports = { register, login, getMe, getAllStudents };
