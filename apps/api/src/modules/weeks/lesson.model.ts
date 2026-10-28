import mongoose from "mongoose";

// One document per lesson day. `data` is the parsed lesson (sections and blocks) from @silo/content.
const schema = new mongoose.Schema({
  week: { type: Number, required: true },
  day: { type: Number, required: true },
  title: String,
  data: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });
schema.index({ week: 1, day: 1 }, { unique: true });
export const Lesson = mongoose.models.Lesson || mongoose.model("Lesson", schema);
