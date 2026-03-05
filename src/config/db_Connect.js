require('dotenv').config();
const mongoose = require('mongoose');

// FIXED: Was a global variable (no const/let/var) — implicit global is a bug
const DB_URI = process.env.KGL_DB;

const connectDb = async () => {
  try {
    if (!DB_URI) {
      console.error("KGL_DB environment variable is not set.");
      process.exit(1);
    }
    await mongoose.connect(DB_URI);
    console.log('Connected to database');
  } catch (err) {
    console.error('Connection to the database failed:', err.message);
    // FIXED: Previously only logged the error and continued running.
    // A server running without a DB appears alive but all API calls fail with 500.
    // Fail fast so the process manager (PM2, Docker, etc.) can restart it.
    process.exit(1);
  }
};

module.exports = connectDb;
