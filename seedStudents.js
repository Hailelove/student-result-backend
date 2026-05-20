// seedStudents.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const Student = require("./models/Student");

// Connect to MongoDB
const dbURI = process.env.MONGO_URI || "mongodb://localhost:27017/resultViewer";
mongoose
  .connect(dbURI)
  .then(() => console.log("Database Connected for CSV Seeding..."))
  .catch((err) => console.error("Connection error:", err));

const seedFromCSV = async () => {
  try {
    console.log("Clearing old records from database...");
    await Student.deleteMany({});

    const results = [];
    const csvFilePath = path.join(__dirname, "students.csv");

    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      console.error(`Error: Cannot find students.csv at ${csvFilePath}`);
      process.exit(1);
    }

    // Read and parse the Excel/CSV rows
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        // Automatically convert flat spreadsheet columns into your nested Schema layout
        results.push({
          studentId: row.studentId?.trim(),
          firstName: row.firstName?.trim(),
          fatherName: row.fatherName?.trim(),
          assessments: {
            individualAssignment: parseFloat(row.individualAssignment) || 0,
            labExam: parseFloat(row.labExam) || 0,
            midExam: parseFloat(row.midExam) || 0,
            project: parseFloat(row.project) || 0,
            finalExam: parseFloat(row.finalExam) || 0,
          },
        });
      })
      .on("end", async () => {
        console.log(
          `Parsed ${results.length} students from CSV. Saving to database...`,
        );

        try {
          // Loop through and save to trigger the totalMark pre-save hook
          for (const studentData of results) {
            await Student.create(studentData);
          }
          console.log("Successfully seeded all students smoothly!");
          process.exit(0);
        } catch (dbError) {
          console.error("Database saving failed:", dbError);
          process.exit(1);
        }
      });
  } catch (error) {
    console.error("Seeding crashed with error:", error);
    process.exit(1);
  }
};

seedFromCSV();
