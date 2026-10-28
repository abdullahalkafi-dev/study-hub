import mongoose from "mongoose";
import { env, scrub } from "./env.ts";

export class DbConfigError extends Error {}

export async function connectDb() {
  if (env.mongoProblem) throw new DbConfigError(env.mongoProblem);
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(env.mongoUri, { dbName: env.mongoDbName, serverSelectionTimeoutMS: 10000 });
  } catch (e) {
    throw new Error(scrub((e as Error).message));
  }
}
export const disconnectDb = () => mongoose.disconnect();
