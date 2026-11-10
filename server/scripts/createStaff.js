require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline-sync");
const User = require("../models/User");

async function createStaff() {
  // Ask for account details
  const email = readline.question("Enter staff email: ").trim().toLowerCase();
  const password = readline.question("Enter password: ", {
    hideEchoBack: true,
  });

  if (!email || password.length < 8) {
    console.log("Enter an email and a password of at least 8 characters.");
    return;
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to:", mongoose.connection.name);

    // Confirm the correct database
    if (!readline.keyInYNStrict("Create account in this database?")) {
      return;
    }

    // Check whether the email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("This email is already registered.");
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create staff account
    await User.create({
      email: email,
      password: hashedPassword,
      role: "staff",
    });

    console.log("Staff account created successfully!");
    console.log("Email:", email);
  } catch (error) {
    console.log("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createStaff();
