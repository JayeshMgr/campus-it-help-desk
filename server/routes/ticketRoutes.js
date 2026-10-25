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
const mongoose = require("mongoose");

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


// Update ticket's status (IT staff only)
// PATCH /api/tickets/:id/status
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware('staff'),
  async (req, res) => {
    try {
      const { status } = req.body;

      //Only allow these three statuses
      const allowedStatuses = ["Open", "In Progress", "Closed"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid ticket status",
        });
      }

        // find ticket by id and update status
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });

        // Return 404 if ticket not found
        if (!ticket) {
          return res.status(404).json({
            message: "Ticket not found",
          });
        }

        // Return the updated ticket
        res.status(200).json(ticket);
    } catch (error) {
      res.status(500).json({
        message: "Failed to update ticket status",
      });
    }
  }
);

//Add a comment to a ticket(students and staff)
//POST /api/tickets/:id/comments

router.post(
  "/:id/comments",
  authMiddleware,
  roleMiddleware("student", "staff"),
  async (req, res) => {
    try {
      const comment = req.body?.comment;

      // Make sure the comment contains valid text.
      if (
        typeof comment !== "string" ||
        !comment.trim() ||
        comment.trim().length > 2000
      ) {
        return res.status(400).json({
          message: "Comment must be between 1 and 2000 characters",
        });
      }

      // Check whether the ticket ID is valid.
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid ticket ID",
        });
      }

      // Staff can comment on any ticket.
      const filter = { _id: req.params.id };

      // Students can only comment on their own non-closed tickets.
      if (req.user.role === "student") {
        filter.studentId = req.user.userId;
        filter.status = { $ne: "Closed" };
      }

      // Add the comment to the ticket's comment history.
      const ticket = await Ticket.findOneAndUpdate(
        filter,
        {
          $push: {
            comments: {
              authorId: req.user.userId,
              authorRole: req.user.role,
              type: "comment",
              text: comment.trim(),
            },
          },
        },
        { new: true, runValidators: true },
      );

      if (!ticket) {
        return res.status(404).json({
          message: "Ticket not found or commenting not allowed",
        });
      }

      // Return the ticket with its updated comments.
      res.status(201).json(ticket);
    } catch (error) {
      res.status(500).json({
        message: "Failed to add comment",
      });
    }
  },
);

 // Close a ticket and save a resolution comment (staff only)
 // PATCH /api/tickets/:id/resolve
router.patch(
  "/:id/resolve",
  authMiddleware,
  roleMiddleware("staff"),
  async (req, res) => {
    try {
      const comment = req.body?.comment;

      if (
        typeof comment !== "string" ||
        !comment.trim() ||
        comment.trim().length > 2000
      ) {
        return res.status(400).json({
          message: "Resolution comment must be between 1 and 2000 characters",
        });
      }

      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid ticket ID",
        });
      }

      const ticket = await Ticket.findOneAndUpdate(
        {
          _id: req.params.id,
          status: { $ne: "Closed" },
        },
        {
          $push: {
            comments: {
              authorId: req.user.userId,
              authorRole: "staff",
              type: "resolution",
              text: comment.trim(),
            },
          },
          $set: {
            status: "Closed",
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!ticket) {
        return res.status(404).json({
          message: "Ticket not found or already closed",
        });
      }

      res.status(200).json(ticket);
    } catch (error) {
      console.error("Failed to resolve ticket:", error);
      res.status(500).json({
        message: "Failed to close ticket",
      });
    }
  }
);
module.exports = router;
