const fs = require("node:fs");
const path = require("node:path");

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

module.exports = {
  courseId: process.env.COURSE_ID,
  accessToken: process.env.ACCESS_TOKEN,
};
