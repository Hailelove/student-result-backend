// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Student = require("./models/Student");

const app = express();
app.use(express.json());
app.use(cors());
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
      studentId: studentId.trim(),
      fatherName: { $regex: new RegExp(`^${fatherName.trim()}$`, "i") },
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
