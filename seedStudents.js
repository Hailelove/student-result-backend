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
        // Normalize spreadsheet keys to lowercase and trim spaces to bypass structural variations
        const keys = Object.keys(row).reduce((acc, k) => {
          acc[k.toLowerCase().trim()] = row[k];
          return acc;
        }, {});

        // Safely extract values regardless of column capitalization variants
        const studentIdVal = (keys["studentid"] || keys["id"] || "").trim();
        const firstNameVal = (keys["firstname"] || keys["name"] || "").trim();
        const fatherNameVal = (keys["fathername"] || "").trim();

        // Push formatted document schema map
        results.push({
          studentId: studentIdVal,
          firstName: firstNameVal,
          fatherName: fatherNameVal,
          assessments: {
            individualAssignment:
              parseFloat(keys["individualassignment"] || keys["assignment"]) ||
              0,
            labExam: parseFloat(keys["labexam"] || keys["lab"]) || 0,
            midExam: parseFloat(keys["midexam"] || keys["mid"]) || 0,
            project: parseFloat(keys["project"]) || 0,
            finalExam: parseFloat(keys["finalexam"] || keys["final"]) || 0,
          },
        });
      })
      .on("end", async () => {
        console.log(
          `Parsed ${results.length} students from CSV. Saving to database...`,
        );

        try {
          // Loop through and save to trigger your schema's totalMark pre-save hooks
          for (const studentData of results) {
            // Only insert documents that have an actual ID attached
            if (studentData.studentId) {
              await Student.create(studentData);
            }
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
