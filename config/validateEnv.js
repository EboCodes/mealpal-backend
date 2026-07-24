// Validates required environment variables on startup so the app fails
// immediately and loudly instead of surfacing confusing errors later
// (e.g. "jwt malformed" or silent Cloudinary upload failures).

const REQUIRED_VARS = [
  "MONGO_URL",
  "JWT_SECRET",
  "CLOUD_NAME",
  "CLOUD_KEY",
  "CLOUD_SECRET",
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variable(s): ${missing.join(", ")}\n` +
      `Set these in your .env file (or hosting provider's env settings) before starting the server.`
    );
    process.exit(1);
  }
}

module.exports = { validateEnv };
