import mongoose from "mongoose";

const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["learner", "admin"], default: "admin" }
}, { timestamps: true });
export const User = mongoose.models.User || mongoose.model("User", schema);
