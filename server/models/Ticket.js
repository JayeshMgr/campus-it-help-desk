
/*
 * models/Ticket.js
 * Mongoose model for help desk tickets (stored in the "tickets" collection).
 * Each ticket belongs to the student who submitted it.
 */

const mongoose = require("mongoose");

//Structure for each comment or resolution note on a ticket
const commentSchema = new mongoose.Schema({
  // User who wrote the comment
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // whether the comment was written by the student or a staff 
  authorRole: {
    type: String,
    enum: ["student", "staff"],
    required: true
  },

  // Identify regular comments, resolution notes, or other types of comments
  type: {
    type: String,
    required: true,
    enum: ["comment", "resolution", "other"],
    default: "comment"
  },

  // Actual comment content
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
}, {
    // automattcally adds createdAt and updatedAt fields
    timestamps: {createdAt: true, updatedAt: false}
});

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
  },

  // store comments and resolution notes
  comments: {
    type: [commentSchema],
    default: []
  }
}, {
  // Automatically adds createdAt and updatedAt fields.
  timestamps: true
});

module.exports = mongoose.model("Ticket", ticketSchema);
