const mongoose = require("mongoose");

const classSectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

classSectionSchema.index({ name: 1, section: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model("ClassSection", classSectionSchema);
