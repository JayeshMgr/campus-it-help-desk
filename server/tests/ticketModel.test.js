const { test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Ticket = require("../models/Ticket");

// document.validate() checks the schema rules in memory.
// No MongoDB connection is opened and nothing is saved.

// Returns the fields of a valid ticket. Tests override one field at a time.
function validTicketData() {
  return {
    title: "Cannot log in to campus Wi-Fi",
    category: "Network",
    description: "My laptop will not connect to the campus network.",
    studentId: new mongoose.Types.ObjectId(),
  };
}

// Returns a valid comment with the given text.
function commentWithText(text) {
  return {
    authorId: new mongoose.Types.ObjectId(),
    authorRole: "staff",
    type: "comment",
    text,
  };
}

// Validates a ticket and returns the validation error, or null if valid.
async function getValidationError(ticket) {
  try {
    await ticket.validate();
    return null;
  } catch (error) {
    return error;
  }
}

// Test 1: A complete ticket is valid and starts as "Open"
test("Valid ticket passes validation and defaults to Open", async () => {
  const ticket = new Ticket(validTicketData());

  const error = await getValidationError(ticket);

  assert.equal(error, null);
  assert.equal(ticket.status, "Open");
  assert.equal(ticket.comments.length, 0);
});

// Test 2: Title is required (FR-10)
test("Ticket without a title is rejected", async () => {
  const data = validTicketData();
  delete data.title;

  const error = await getValidationError(new Ticket(data));

  assert.ok(error, "expected a validation error");
  assert.ok(error.errors.title, "expected an error on the title field");
  assert.equal(error.errors.title.kind, "required");
});

// Test 3: trim turns "   " into "", which fails the required rule (FR-10)
test("Whitespace-only description is rejected", async () => {
  const data = validTicketData();
  data.description = "     ";

  const error = await getValidationError(new Ticket(data));

  assert.ok(error, "expected a validation error");
  assert.ok(error.errors.description, "expected an error on the description field");
  assert.equal(error.errors.description.kind, "required");
});

// Test 4: Only Open, In Progress, and Closed are allowed (FR-11)
test("Invalid status is rejected", async () => {
  const data = validTicketData();
  data.status = "Resolved";

  const error = await getValidationError(new Ticket(data));

  assert.ok(error, "expected a validation error");
  assert.ok(error.errors.status, "expected an error on the status field");
  assert.equal(error.errors.status.kind, "enum");
});

// Test 5: Each allowed status value passes
test("Valid status values are accepted", async () => {
  for (const status of ["Open", "In Progress", "Closed"]) {
    const data = validTicketData();
    data.status = status;

    const error = await getValidationError(new Ticket(data));

    assert.equal(error, null, `status "${status}" should be valid`);
  }
});

// Test 6: Upper boundary of the comment length limit
test("Comment containing exactly 2,000 characters is accepted", async () => {
  const data = validTicketData();
  data.comments = [commentWithText("a".repeat(2000))];

  const error = await getValidationError(new Ticket(data));

  assert.equal(error, null);
});

// Test 7: One character over the limit
test("Comment containing 2,001 characters is rejected", async () => {
  const data = validTicketData();
  data.comments = [commentWithText("a".repeat(2001))];

  const error = await getValidationError(new Ticket(data));

  assert.ok(error, "expected a validation error");
  assert.ok(error.errors["comments.0.text"], "expected an error on the comment text");
  assert.equal(error.errors["comments.0.text"].kind, "maxlength");
});
