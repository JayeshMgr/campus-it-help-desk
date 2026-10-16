const express = require("express");
const Ticket = require("../models/Ticket");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

// Create a ticket
router.post(
  "/",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const ticket = await Ticket.create({
        title: req.body.title,
        category: req.body.category,
        description: req.body.description,
        studentId: req.user.userId,
      });

      res.status(201).json(ticket);
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  },
);

module.exports = router;
