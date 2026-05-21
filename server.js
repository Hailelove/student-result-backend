// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Student = require("./models/Student");

const app = express();
app.use(express.json());

// app.use(
//   cors({
//     origin: [
//       "https://student-result-frontend-jyfu-git-main-deme1.vercel.app",
//       "https://student-result-frontend-jyfu-f9r6vl1ju-deme1.vercel.app",
//       "http://localhost:5173", // Allows you to test locally using Vite
//       "http://localhost:3000",
//     ],
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     credentials: true,
//   }),
// );
const allowedOrigins = [
  "https://student-result-frontend-jyfu.vercel.app",
  "https://student-result-frontend-jyfu-git-main-deme1.vercel.app",
  "https://student-result-frontend-jyfu-f9r6vl1ju-deme1.vercel.app",
  "http://localhost:5173", // For local Vite development testing
  "http://localhost:3000",
];
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

const dbURI = process.env.MONGO_URI || "mongodb://localhost:27017/resultViewer";

// MongoDB Connection
mongoose
  .connect(dbURI)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("Database connection error:", err));

// Route to fetch student result
app.post("/api/results/view", async (req, res) => {
  const { studentId, fatherName } = req.body;

  if (!studentId || !fatherName) {
    return res
      .status(400)
      .json({ message: "Please provide both Student ID and Father's Name." });
  }

  try {
    // Case-insensitive lookup for Father's Name
    const student = await Student.findOne({
      studentId: { $regex: new RegExp(`^${studentId.trim()}$`, "i") },
      fatherName: { $regex: new RegExp(fatherName.trim(), "i") },
    });

    if (!student) {
      return res
        .status(404)
        .json({ message: "No student found matching these credentials." });
    }

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Server error tracking down data." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
