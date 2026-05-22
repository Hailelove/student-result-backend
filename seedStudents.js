// seedStudents.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const Student = require("./models/Student");

// Direct connection string to bypass Windows CMD issues
const dbURI =
  "mongodb+srv://haile11new_db_user:OiPFnFy1Ns6iZJHS@cluster0.bacqxzc.mongodb.net/resultViewer?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(dbURI)
  .then(() => console.log("🚀 Connected DIRECTLY to MongoDB Atlas..."))
  .catch((err) => console.error("Connection error:", err));

const seedFromCSV = async () => {
  try {
    console.log("Clearing old records from database...");
    await Student.deleteMany({});

    const results = [];
    const csvFilePath = path.join(__dirname, "students.csv");

    if (!fs.existsSync(csvFilePath)) {
      console.error(`Error: Cannot find students.csv at ${csvFilePath}`);
      process.exit(1);
    }

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        // Normalize keys by lowercase and remove all whitespace completely
        const keys = Object.keys(row).reduce((acc, k) => {
          const cleanKey = k.toLowerCase().replace(/\s+/g, "");
          acc[cleanKey] = row[k];
          return acc;
        }, {});

        // Fallback checks for column variations containing your target names
        const findValueByKeyword = (keyword, defaultVal = "") => {
          const matchingKey = Object.keys(keys).find((k) =>
            k.includes(keyword),
          );
          return matchingKey ? keys[matchingKey] : defaultVal;
        };

        const studentIdVal = (
          keys["studentid"] ||
          keys["id"] ||
          findValueByKeyword("id")
        ).trim();
        const firstNameVal = (
          keys["firstname"] ||
          keys["name"] ||
          findValueByKeyword("first")
        ).trim();
        const fatherNameVal = (
          keys["fathername"] || findValueByKeyword("father")
        ).trim();

        if (studentIdVal) {
          results.push({
            studentId: studentIdVal,
            firstName: firstNameVal,
            fatherName: fatherNameVal,
            assessments: {
              individualAssignment:
                parseFloat(
                  keys["individualassignment"] ||
                    keys["assignment"] ||
                    findValueByKeyword("assignment"),
                ) || 0,
              labExam:
                parseFloat(
                  keys["labexam"] || keys["lab"] || findValueByKeyword("lab"),
                ) || 0,
              midExam:
                parseFloat(
                  keys["midexam"] || keys["mid"] || findValueByKeyword("mid"),
                ) || 0,
              project:
                parseFloat(keys["project"] || findValueByKeyword("project")) ||
                0,
              finalExam:
                parseFloat(
                  keys["finalexam"] ||
                    keys["final"] ||
                    findValueByKeyword("final"),
                ) || 0,
            },
          });
        }
      })
      .on("end", async () => {
        console.log(
          `Parsed ${results.length} students from CSV. Saving to database...`,
        );

        try {
          // Track entry counts to ensure data is real
          let successfulInserts = 0;
          for (const studentData of results) {
            if (studentData.studentId && studentData.fatherName) {
              await Student.create(studentData);
              successfulInserts++;
            } else {
              console.warn(
                `⚠️ Skipping row with missing elements: ID='${studentData.studentId}', FatherName='${studentData.fatherName}'`,
              );
            }
          }
          console.log(
            `Successfully seeded ${successfulInserts} students smoothly!`,
          );
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
