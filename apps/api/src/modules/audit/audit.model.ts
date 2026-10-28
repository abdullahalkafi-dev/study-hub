import mongoose from "mongoose";

const schema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  email: { type: String, default: "" },
  action: { type: String, required: true }, // e.g. progress.complete, progress.undo, auth.login, upload.add
  target: { type: String, default: "" },    // e.g. "1-3-math"
  meta: { type: mongoose.Schema.Types.Mixed },
  at: { type: Date, default: Date.now, index: true }
});
export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", schema);
