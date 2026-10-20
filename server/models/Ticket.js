
/*
 * models/Ticket.js
 * Mongoose model for help desk tickets (stored in the "tickets" collection).
 * Each ticket belongs to the student who submitted it.
 */

const mongoose = require("mongoose");

// title, category, and description are required; trim removes extra
// spaces at the start and end before saving.
const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  // The _id of the student who created the ticket. ref: "User" links it
  // to the User model. It's set from the JWT, not from the request body.
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Every new ticket starts as "Open".
  status: {
    type: String,
    enum: ["Open", "In Progress", "Closed"],
    default: "Open"
  }
}, {
  // Automatically adds createdAt and updatedAt fields.
  timestamps: true
});

module.exports = mongoose.model("Ticket", ticketSchema);
