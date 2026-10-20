/*
 * routes/ticketRoutes.js
 * Ticket routes, mounted at /api/tickets in app.js.
 * Every route here is protected by two middleware steps, run in order:
 *   1. authMiddleware            - requires a valid JWT and sets req.user
 *   2. roleMiddleware("<role>")  - only allows the listed role
 */

const express = require("express");
const Ticket = require("../models/Ticket");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

// Create a ticket
// POST /api/tickets  (students only)  body: { title, category, description }
router.post(
  "/",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      // Save a new ticket to MongoDB. studentId comes from the verified
      // token (req.user), not the request body, so a student can't
      // create a ticket under someone else's account.
      // status ("Open") and timestamps are filled in by the schema.
      const ticket = await Ticket.create({
        title: req.body.title,
        category: req.body.category,
        description: req.body.description,
        studentId: req.user.userId,
      });

      res.status(201).json(ticket);
    } catch (error) {
      // Most failures here are Mongoose validation errors (for example,
      // a missing required field), so this returns 400 Bad Request
      // with the validation message.
      res.status(400).json({
        message: error.message,
      });
    }
  },
);

// Get tickets submitted by the logged-in student
// GET /api/tickets/mine  (students only)
router.get("/mine", authMiddleware, roleMiddleware("student"), async (req, res) => {
  try {
    
    // Only return tickets whose studentId matches the logged-in user,
    // so students can only see their own tickets.
    const tickets = await Ticket.find({
      studentId: req.user.userId
    });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve tickets"
    });
  }
});

//Get all tickets  for ITStaff
// GET /api/tickets/all  (IT Support Staff only)
router.get('/all', authMiddleware, roleMiddleware('staff'), async (req, res) => { 
  try {
    // An empty filter returns every ticket from every student.
    const tickets = await Ticket.find();
    res.status(200).json(tickets);
  }
  catch (error) { 
    res.status(500).json({
      message: "Failed to retrieve tickets",
    });
  }
})

module.exports = router;
