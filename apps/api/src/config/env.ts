import crypto from "node:crypto";

// MongoDB Atlas only. The URI (and optionally the password and db name) come from the gitignored .env.
// "<password>" in the URI is replaced by MONGODB_PASSWORD, so the secret can live on its own line.
function resolveMongoUri() {
  let uri = (process.env.MONGODB_URI || "").trim();
  if (!uri) return { uri: "", problem: "MONGODB_URI is not set. Copy .env.example to .env and paste your MongoDB Atlas connection string there." };
  const user = process.env.MONGODB_USER || process.env.MONGODB_USERNAME || "", pw = process.env.MONGODB_PASSWORD || "";
  const userPh = /<(db_username|username|user)>/, pwPh = /<(db_password|password)>/;
  if (userPh.test(uri)) {
    if (!user) return { uri: "", problem: "MONGODB_URI still has <db_username>. Put your Atlas database user name in .env as MONGODB_USER=..." };
    uri = uri.replace(userPh, encodeURIComponent(user));
  }
  if (pwPh.test(uri)) {
    if (!pw) return { uri: "", problem: "MONGODB_URI still has <db_password>. Put your Atlas database password in .env as MONGODB_PASSWORD=..." };
    uri = uri.replace(pwPh, encodeURIComponent(pw));
  }
  if (/^mongodb:\/\/(127\.0\.0\.1|localhost|\[::1\])/.test(uri))
    return { uri: "", problem: "MONGODB_URI is a local address. Use your MongoDB Atlas connection string (mongodb+srv://...)." };
  return { uri, problem: "" };
}
const mongo = resolveMongoUri();

export const env = {
  port: parseInt(process.env.API_PORT || "4000", 10),
  mongoUri: mongo.uri,
  mongoProblem: mongo.problem,
  mongoDbName: process.env.MONGODB_DB_NAME || "silo-study",
  secrets: [process.env.MONGODB_PASSWORD, process.env.MONGODB_USER, process.env.MONGODB_USERNAME, process.env.MINIO_SECRET_KEY, process.env.LEARNER_PASSWORD].filter((s): s is string => !!s),
  webOrigin: (process.env.WEB_ORIGIN || "http://localhost:3000").split(","),
  // Login is required only when a learner password is set in .env. Otherwise single-user open mode.
  learnerEmail: (process.env.LEARNER_EMAIL || "").toLowerCase(),
  learnerPassword: process.env.LEARNER_PASSWORD || "",
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex"),
  jwtSecretIsRandom: !process.env.JWT_SECRET,
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
    port: parseInt(process.env.MINIO_PORT || "9000", 10),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "",
    secretKey: process.env.MINIO_SECRET_KEY || "",
    bucket: process.env.MINIO_BUCKET || "silo-uploads"
  }
};
export const authRequired = () => !!env.learnerPassword;

// Never let a secret reach a log line.
export function scrub(text: string) {
  let t = text.replace(/(mongodb(?:\+srv)?:\/\/)[^@\s/]+@/gi, "$1****@");
  for (const s of env.secrets) t = t.split(s).join("****").split(encodeURIComponent(s)).join("****");
  return t;
}
