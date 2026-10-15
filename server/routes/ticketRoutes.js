
const express = require("express");
const Ticket = require("../models/Ticket");

const router = express.Router();

// Create a ticket
router.post("/", async (req, res) => {
  try {
    const ticket = await Ticket.create({
      title: req.body.title,
      description: req.body.description
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

module.exports = router;
