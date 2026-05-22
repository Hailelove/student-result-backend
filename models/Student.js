// models/Student.js
const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  fatherName: { type: String, required: true },
  assessments: {
    individualAssignment: { type: Number, min: 0, max: 10, default: 0 }, // 10%
    labExam: { type: Number, min: 0, max: 10, default: 0 }, // 10%
    midExam: { type: Number, min: 0, max: 25, default: 0 }, // 25%
    project: { type: Number, min: 0, max: 15, default: 0 }, // 15%
    finalExam: { type: Number, min: 0, max: 40, default: 0 }, // 40%
  },
  totalMark: { type: Number },
});

// Pre-save hook to automatically calculate total marks
StudentSchema.pre("save", function (next) {
  const { individualAssignment, labExam, midExam, project, finalExam } =
    this.assessments;
  this.totalMark =
    (individualAssignment || 0) +
    (labExam || 0) +
    (midExam || 0) +
    (project || 0) +
    (finalExam || 0);
  return next();
});

module.exports = mongoose.model("Student", StudentSchema);
