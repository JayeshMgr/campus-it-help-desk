/*
 * config/db.js
 * Connects to MongoDB with Mongoose, using the connection string
 * stored in the MONGO_URI environment variable.
 */

const mongoose = require("mongoose");

// Open the MongoDB connection. server.js calls this before starting the server.
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    // The app can't work without a database, so log the reason and
    // stop the process with a failure code (1) instead of running broken.
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
