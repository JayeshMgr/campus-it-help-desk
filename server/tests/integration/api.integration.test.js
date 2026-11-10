/*
 * tests/integration/api.integration.test.js
 * Milestone 3, Section 7.1 - Integration tests INT-01 to INT-10.
 *
 * Type: REAL DATABASE integration test (not mocked).
 * The real Express app (app.js -> routes -> middleware -> controllers ->
 * Mongoose models) is started on a random local port and called over HTTP.
 * Data is written to an isolated local MongoDB database
 * (campus_it_help_desk_m3final_int_test), which is dropped before and after
 * the run. MongoDB Atlas and server/.env are never used.
 *
 * Run: npm run test:integration   (requires MongoDB on 127.0.0.1:27017)
 */

const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  testMongoUri,
  randomSecret,
  randomPassword,
  testEmail,
  createStaffAccount,
  makeApi,
} = require("../support/testEnv");

const MONGO_URI = testMongoUri("int");
process.env.JWT_SECRET = randomSecret();

const app = require("../../app");
const User = require("../../models/User");
const Ticket = require("../../models/Ticket");

let server;
let api;

// Accounts shared by the test groups. Passwords exist only in memory.
const studentA = { email: testEmail("student.a"), password: randomPassword() };
const studentB = { email: testEmail("student.b"), password: randomPassword() };
const studentC = { email: testEmail("student.c"), password: randomPassword() };
const staff = { email: testEmail("it.staff"), password: randomPassword() };

async function register(account) {
  return api("POST", "/api/auth/register", {
    body: { email: account.email, password: account.password },
  });
}

async function login(account) {
  const res = await api("POST", "/api/auth/login", {
    body: { email: account.email, password: account.password },
  });
  assert.equal(res.status, 200, `login failed for test account (${res.status})`);
  account.token = res.body.token;
  account.id = res.body.user.id;
  return res;
}

async function submitTicket(account, overrides = {}) {
  const res = await api("POST", "/api/tickets", {
    token: account.token,
    body: {
      title: "Wi-Fi drops in library",
      category: "Network",
      description: "Connection drops every few minutes on the 2nd floor.",
      ...overrides,
    },
  });
  assert.equal(res.status, 201, `ticket submission failed (${res.status})`);
  return res.body;
}

before(async () => {
  await mongoose.connect(MONGO_URI);
  await mongoose.connection.dropDatabase();
  await User.createIndexes();

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  api = makeApi(`http://127.0.0.1:${server.address().port}`);
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("INT-01 Student registration (authRoutes -> authController -> User model -> MongoDB)", () => {
  test("INT-01a valid registration creates a student account with a hashed password", async () => {
    const res = await register(studentA);

    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, studentA.email);
    assert.equal(res.body.user.role, "student");
    assert.equal("password" in res.body.user, false);
    assert.equal(res.text.includes(studentA.password), false);

    const stored = await User.findOne({ email: studentA.email }).lean();
    assert.ok(stored, "account should be stored in the database");
    assert.equal(stored.role, "student");
    assert.notEqual(stored.password, studentA.password, "plaintext password must not be stored");
    assert.match(stored.password, /^\$2[aby]\$10\$/, "stored value should be a bcrypt hash");
    assert.equal(await bcrypt.compare(studentA.password, stored.password), true);
  });

  test("INT-01b missing email or password is rejected and no account is created", async () => {
    const before = await User.countDocuments();
    const cases = [
      { password: randomPassword() },
      { email: testEmail("nopass") },
      { email: "", password: "" },
      {},
    ];
    for (const body of cases) {
      const res = await api("POST", "/api/auth/register", { body });
      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Email and password are required");
    }
    assert.equal(await User.countDocuments(), before);
  });

  test("INT-01c duplicate email is rejected and only one account exists", async () => {
    const res = await register({ email: studentA.email, password: randomPassword() });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "User already exists");
    assert.equal(await User.countDocuments({ email: studentA.email }), 1);
  });

  test("INT-01d a role supplied in the request body is ignored (no self-registration as staff)", async () => {
    const res = await api("POST", "/api/auth/register", {
      body: { email: studentB.email, password: studentB.password, role: "staff" },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, "student");
    const stored = await User.findOne({ email: studentB.email }).lean();
    assert.equal(stored.role, "student");

    await register(studentC);
    await createStaffAccount(User, staff.email, staff.password);
  });
});

describe("INT-02 Authentication (login -> JWT -> authMiddleware on protected routes)", () => {
  test("INT-02a student login returns a valid signed JWT with the correct user ID and role", async () => {
    const res = await login(studentA);
    const stored = await User.findOne({ email: studentA.email }).lean();

    assert.equal(res.body.message, "Login Successful");
    assert.equal(res.body.token.split(".").length, 3);
    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    assert.equal(payload.userId, String(stored._id));
    assert.equal(payload.role, "student");
    assert.equal(payload.exp - payload.iat, 3600);
    assert.equal("password" in res.body.user, false);

    await login(studentB);
    await login(studentC);
  });

  test("INT-02b staff login returns a token with the staff role", async () => {
    const res = await login(staff);
    assert.equal(res.body.user.role, "staff");
    assert.equal(jwt.verify(staff.token, process.env.JWT_SECRET).role, "staff");
  });

  test("INT-02c wrong password and unknown email both return 401 with the same message and no token", async () => {
    const wrong = await api("POST", "/api/auth/login", {
      body: { email: studentA.email, password: "Wrong-password-1" },
    });
    const unknown = await api("POST", "/api/auth/login", {
      body: { email: testEmail("nobody"), password: studentA.password },
    });
    for (const res of [wrong, unknown]) {
      assert.equal(res.status, 401);
      assert.equal(res.body.message, "Invalid credentials");
      assert.equal(res.body.token, undefined);
    }
  });

  test("INT-02d a valid token is accepted on a protected endpoint", async () => {
    const res = await api("GET", "/api/tickets/mine", { token: studentA.token });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  test("INT-02e missing, malformed, forged, and expired tokens are rejected with 401", async () => {
    const forged = jwt.sign({ userId: studentA.id, role: "staff" }, "attacker-secret");
    const expired = jwt.sign(
      { userId: studentA.id, role: "student", exp: Math.floor(Date.now() / 1000) - 10 },
      process.env.JWT_SECRET,
    );
    const cases = [
      { label: "no header", headers: {} },
      { label: "Basic scheme", headers: { Authorization: `Basic ${studentA.token}` } },
      { label: "garbage token", headers: { Authorization: "Bearer not.a.jwt" } },
      { label: "forged staff token", headers: { Authorization: `Bearer ${forged}` } },
      { label: "expired token", headers: { Authorization: `Bearer ${expired}` } },
    ];
    for (const { label, headers } of cases) {
      for (const urlPath of ["/api/tickets/mine", "/api/tickets/all"]) {
        const res = await api("GET", urlPath, { headers });
        assert.equal(res.status, 401, `${label} on ${urlPath}`);
        assert.equal(Array.isArray(res.body), false, `${label} must not return tickets`);
      }
    }
  });
});

describe("INT-03 Student ticket submission (POST /api/tickets -> Ticket model)", () => {
  test("INT-03a authenticated student submits a ticket; it is persisted with the student's ID and status Open", async () => {
    const res = await api("POST", "/api/tickets", {
      token: studentA.token,
      body: {
        title: "  Printer not working  ",
        category: "Hardware",
        description: "Room 110 printer shows paper jam error.",
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.title, "Printer not working");
    assert.equal(res.body.status, "Open");
    assert.equal(String(res.body.studentId), studentA.id);

    const stored = await Ticket.findById(res.body._id).lean();
    assert.ok(stored, "ticket should be stored in the database");
    assert.equal(String(stored.studentId), studentA.id);
    assert.equal(stored.category, "Hardware");
    assert.ok(stored.createdAt instanceof Date);
  });

  test("INT-03b studentId and status in the request body are ignored (owner comes from the JWT)", async () => {
    const res = await api("POST", "/api/tickets", {
      token: studentA.token,
      body: {
        title: "VPN error",
        category: "Network",
        description: "VPN client fails to connect.",
        studentId: studentB.id,
        status: "Closed",
      },
    });
    assert.equal(res.status, 201);
    assert.equal(String(res.body.studentId), studentA.id);
    assert.equal(res.body.status, "Open");
  });

  test("INT-03c missing or whitespace-only required fields are rejected and nothing is saved", async () => {
    const before = await Ticket.countDocuments();
    const valid = { title: "T", category: "C", description: "D" };
    const cases = [
      { ...valid, title: undefined },
      { ...valid, category: "   " },
      { ...valid, description: "" },
      {},
    ];
    for (const body of cases) {
      const res = await api("POST", "/api/tickets", { token: studentA.token, body });
      assert.equal(res.status, 400);
      assert.ok(res.body.message);
    }
    assert.equal(await Ticket.countDocuments(), before);
  });

  test("INT-03d staff cannot submit student tickets (403) and anonymous users get 401", async () => {
    const before = await Ticket.countDocuments();
    const body = { title: "T", category: "C", description: "D" };
    assert.equal((await api("POST", "/api/tickets", { token: staff.token, body })).status, 403);
    assert.equal((await api("POST", "/api/tickets", { body })).status, 401);
    assert.equal(await Ticket.countDocuments(), before);
  });
});

describe("INT-04 Student ticket retrieval (GET /api/tickets/mine)", () => {
  test("INT-04a each student receives only their own tickets", async () => {
    await submitTicket(studentB, { title: "Email password reset" });

    const mineA = await api("GET", "/api/tickets/mine", { token: studentA.token });
    const mineB = await api("GET", "/api/tickets/mine", { token: studentB.token });
    assert.equal(mineA.status, 200);
    assert.equal(mineB.status, 200);

    const dbCountA = await Ticket.countDocuments({ studentId: studentA.id });
    assert.equal(mineA.body.length, dbCountA);
    assert.equal(mineB.body.length, 1);
    assert.ok(mineA.body.every((t) => String(t.studentId) === studentA.id));
    assert.ok(mineB.body.every((t) => String(t.studentId) === studentB.id));

    const idsA = new Set(mineA.body.map((t) => t._id));
    assert.ok(mineB.body.every((t) => !idsA.has(t._id)), "no overlap between students");
    assert.equal(mineB.text.includes("Printer not working"), false);
  });

  test("INT-04b a student with no tickets receives an empty list", async () => {
    const res = await api("GET", "/api/tickets/mine", { token: studentC.token });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, []);
  });

  test("INT-04c staff token on the student-only /mine route is rejected with 403", async () => {
    const res = await api("GET", "/api/tickets/mine", { token: staff.token });
    assert.equal(res.status, 403);
  });
});

describe("INT-05 Staff ticket retrieval (GET /api/tickets/all with populate)", () => {
  test("INT-05a staff receive tickets from multiple students with the owner's email and no password", async () => {
    const res = await api("GET", "/api/tickets/all", { token: staff.token });
    assert.equal(res.status, 200);
    assert.equal(res.body.length, await Ticket.countDocuments());

    const emails = new Set(res.body.map((t) => t.studentId.email));
    assert.ok(emails.has(studentA.email));
    assert.ok(emails.has(studentB.email));

    for (const ticket of res.body) {
      assert.deepEqual(Object.keys(ticket.studentId).sort(), ["_id", "email"]);
    }
    assert.equal(/\$2[aby]\$/.test(res.text), false, "no password hashes in response");
  });

  test("INT-05b students cannot use the staff /all route (403, no ticket data)", async () => {
    const res = await api("GET", "/api/tickets/all", { token: studentA.token });
    assert.equal(res.status, 403);
    assert.equal(Array.isArray(res.body), false);
    assert.equal(res.text.includes(studentB.email), false);
  });
});

describe("INT-06 Ticket status management (PATCH /api/tickets/:id/status)", () => {
  let ticket;

  before(async () => {
    ticket = await submitTicket(studentA, { title: "Projector flickers" });
  });

  async function setStatus(account, id, status) {
    return api("PATCH", `/api/tickets/${id}/status`, { token: account.token, body: { status } });
  }

  async function studentView(id) {
    const res = await api("GET", "/api/tickets/mine", { token: studentA.token });
    return res.body.find((t) => t._id === id);
  }

  test("INT-06a staff change Open -> In Progress; the change persists and the student sees it", async () => {
    const res = await setStatus(staff, ticket._id, "In Progress");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "In Progress");
    assert.equal((await Ticket.findById(ticket._id).lean()).status, "In Progress");
    assert.equal((await studentView(ticket._id)).status, "In Progress");
  });

  test("INT-06b staff change In Progress -> Closed; the change persists and the student sees it", async () => {
    const res = await setStatus(staff, ticket._id, "Closed");
    assert.equal(res.status, 200);
    assert.equal((await Ticket.findById(ticket._id).lean()).status, "Closed");
    assert.equal((await studentView(ticket._id)).status, "Closed");
  });

  test("INT-06c invalid or missing status values are rejected and the status is unchanged", async () => {
    for (const status of ["Resolved", "open", "", undefined]) {
      const res = await setStatus(staff, ticket._id, status);
      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Invalid ticket status");
    }
    assert.equal((await Ticket.findById(ticket._id).lean()).status, "Closed");
  });

  test("INT-06d malformed ticket ID returns 400 and an unknown valid ID returns 404", async () => {
    const malformed = await setStatus(staff, "not-a-valid-id", "Closed");
    assert.equal(malformed.status, 400);
    assert.equal(malformed.body.message, "Invalid ticket ID");

    const unknown = await setStatus(staff, new mongoose.Types.ObjectId().toString(), "Closed");
    assert.equal(unknown.status, 404);
  });

  test("INT-06e students cannot change ticket status (403) and the status is unchanged", async () => {
    const res = await setStatus(studentA, ticket._id, "Open");
    assert.equal(res.status, 403);
    assert.equal((await Ticket.findById(ticket._id).lean()).status, "Closed");
  });
});

describe("INT-07 Resolution notes (PATCH /api/tickets/:id/resolve)", () => {
  let ticket;

  before(async () => {
    ticket = await submitTicket(studentA, { title: "Cannot access Canvas" });
  });

  function resolve(account, id, comment) {
    return api("PATCH", `/api/tickets/${id}/resolve`, { token: account.token, body: { comment } });
  }

  test("INT-07a empty, whitespace-only, and 2,001-character notes are rejected; ticket stays open", async () => {
    for (const comment of ["", "    ", "x".repeat(2001), undefined, 42]) {
      const res = await resolve(staff, ticket._id, comment);
      assert.equal(res.status, 400);
    }
    const stored = await Ticket.findById(ticket._id).lean();
    assert.equal(stored.status, "Open");
    assert.equal(stored.comments.length, 0);
  });

  test("INT-07b students cannot resolve tickets (403)", async () => {
    const res = await resolve(studentA, ticket._id, "I fixed it myself");
    assert.equal(res.status, 403);
    assert.equal((await Ticket.findById(ticket._id).lean()).status, "Open");
  });

  test("INT-07c staff resolve with a note: status becomes Closed and the note is stored as a resolution", async () => {
    const note = "  Cleared browser cache and reset SSO session.  ";
    const res = await resolve(staff, ticket._id, note);
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "Closed");

    const stored = await Ticket.findById(ticket._id).lean();
    assert.equal(stored.status, "Closed");
    const last = stored.comments.at(-1);
    assert.equal(last.type, "resolution");
    assert.equal(last.authorRole, "staff");
    assert.equal(last.text, note.trim());
    assert.equal(String(last.authorId), staff.id);
  });

  test("INT-07d the ticket owner can read the resolution note through /mine", async () => {
    const res = await api("GET", "/api/tickets/mine", { token: studentA.token });
    const mine = res.body.find((t) => t._id === ticket._id);
    assert.equal(mine.status, "Closed");
    const resolution = mine.comments.find((c) => c.type === "resolution");
    assert.equal(resolution.text, "Cleared browser cache and reset SSO session.");
  });

  test("INT-07e a note of exactly 2,000 characters is accepted (upper boundary)", async () => {
    const other = await submitTicket(studentB, { title: "Boundary resolution" });
    const res = await resolve(staff, other._id, "y".repeat(2000));
    assert.equal(res.status, 200);
    assert.equal(res.body.comments.at(-1).text.length, 2000);
  });

  test("INT-07f resolving an already Closed ticket returns 404 and adds no second note", async () => {
    const res = await resolve(staff, ticket._id, "Second note");
    assert.equal(res.status, 404);
    const stored = await Ticket.findById(ticket._id).lean();
    assert.equal(stored.comments.filter((c) => c.type === "resolution").length, 1);
  });
});

describe("INT-08 Reopening (PATCH /api/tickets/:id/reopen)", () => {
  let closedTicket;
  let openTicket;

  before(async () => {
    closedTicket = await submitTicket(studentA, { title: "Laptop will not charge" });
    await api("PATCH", `/api/tickets/${closedTicket._id}/resolve`, {
      token: staff.token,
      body: { comment: "Replaced charger." },
    });
    openTicket = await submitTicket(studentA, { title: "Still open" });
  });

  function reopen(account, id, comment) {
    return api("PATCH", `/api/tickets/${id}/reopen`, {
      token: account?.token,
      body: comment === undefined ? {} : { comment },
    });
  }

  test("INT-08a reopening without an explanation is rejected and the ticket stays Closed", async () => {
    for (const comment of [undefined, "", "   ", "z".repeat(2001)]) {
      const res = await reopen(studentA, closedTicket._id, comment);
      assert.equal(res.status, 400);
    }
    assert.equal((await Ticket.findById(closedTicket._id).lean()).status, "Closed");
  });

  test("INT-08b another student cannot reopen the ticket (404) and it stays Closed", async () => {
    const res = await reopen(studentB, closedTicket._id, "Not my ticket");
    assert.equal(res.status, 404);
    assert.equal((await Ticket.findById(closedTicket._id).lean()).status, "Closed");
  });

  test("INT-08c staff cannot use the student reopen route (403); anonymous request gets 401", async () => {
    assert.equal((await reopen(staff, closedTicket._id, "Staff reopen")).status, 403);
    assert.equal((await reopen(null, closedTicket._id, "Anonymous")).status, 401);
    assert.equal((await Ticket.findById(closedTicket._id).lean()).status, "Closed");
  });

  test("INT-08d a ticket that is not Closed cannot be reopened (404)", async () => {
    const res = await reopen(studentA, openTicket._id, "Reopen an open ticket");
    assert.equal(res.status, 404);
    const stored = await Ticket.findById(openTicket._id).lean();
    assert.equal(stored.comments.length, 0);
  });

  test("INT-08e the owner reopens their Closed ticket: status becomes Open and the explanation is stored", async () => {
    const res = await reopen(studentA, closedTicket._id, "  Charger stopped working again.  ");
    assert.equal(res.status, 200);
    assert.equal(res.body.message, "Ticket reopened successfully.");
    assert.equal(res.body.ticket.status, "Open");

    const stored = await Ticket.findById(closedTicket._id).lean();
    assert.equal(stored.status, "Open");
    const last = stored.comments.at(-1);
    assert.equal(last.type, "reopen");
    assert.equal(last.authorRole, "student");
    assert.equal(last.text, "Charger stopped working again.");
    assert.equal(String(last.authorId), studentA.id);
    assert.equal(stored.comments.filter((c) => c.type === "resolution").length, 1, "history kept");
  });

  test("INT-08f a malformed ticket ID returns 400 like the other ticket routes", async () => {
    const res = await reopen(studentA, "not-a-valid-id", "Malformed ID");
    assert.equal(res.status, 400, `expected 400 "Invalid ticket ID", got ${res.status} ${res.text}`);
  });
});

describe("INT-09 Comments (POST /api/tickets/:id/comments) - current permission rules", () => {
  let ticketA;
  let closedTicketA;

  before(async () => {
    ticketA = await submitTicket(studentA, { title: "Software install request" });
    closedTicketA = await submitTicket(studentA, { title: "Closed comment target" });
    await api("PATCH", `/api/tickets/${closedTicketA._id}/resolve`, {
      token: staff.token,
      body: { comment: "Done." },
    });
  });

  function comment(account, id, text) {
    return api("POST", `/api/tickets/${id}/comments`, {
      token: account?.token,
      body: { comment: text },
    });
  }

  test("INT-09a a student can comment on their own non-Closed ticket", async () => {
    const res = await comment(studentA, ticketA._id, "  Need MATLAB installed.  ");
    assert.equal(res.status, 201);
    const last = res.body.comments.at(-1);
    assert.equal(last.authorRole, "student");
    assert.equal(last.type, "comment");
    assert.equal(last.text, "Need MATLAB installed.");
  });

  test("INT-09b staff can comment on any student's ticket and the owner sees the comment", async () => {
    const res = await comment(staff, ticketA._id, "Scheduled for tomorrow.");
    assert.equal(res.status, 201);
    assert.equal(res.body.comments.at(-1).authorRole, "staff");

    const mine = await api("GET", "/api/tickets/mine", { token: studentA.token });
    const seen = mine.body.find((t) => t._id === ticketA._id);
    assert.ok(seen.comments.some((c) => c.text === "Scheduled for tomorrow."));
  });

  test("INT-09c a student cannot comment on another student's ticket (404, nothing added)", async () => {
    const before = (await Ticket.findById(ticketA._id).lean()).comments.length;
    const res = await comment(studentB, ticketA._id, "Intruder comment");
    assert.equal(res.status, 404);
    assert.equal((await Ticket.findById(ticketA._id).lean()).comments.length, before);
  });

  test("INT-09d a student cannot comment on their own Closed ticket (404)", async () => {
    const res = await comment(studentA, closedTicketA._id, "Comment after close");
    assert.equal(res.status, 404);
  });

  test("INT-09e staff can still comment on a Closed ticket (current backend rule)", async () => {
    const res = await comment(staff, closedTicketA._id, "Follow-up after close");
    assert.equal(res.status, 201);
    assert.equal(res.body.status, "Closed");
  });

  test("INT-09f comment length: empty, whitespace, and 2,001 characters rejected; 1 and 2,000 accepted", async () => {
    for (const text of ["", "   ", "c".repeat(2001), undefined]) {
      assert.equal((await comment(studentA, ticketA._id, text)).status, 400);
    }
    assert.equal((await comment(studentA, ticketA._id, "c")).status, 201);
    assert.equal((await comment(studentA, ticketA._id, "c".repeat(2000))).status, 201);
  });

  test("INT-09g malformed ticket ID returns 400; missing token returns 401", async () => {
    assert.equal((await comment(staff, "bad-id", "x")).status, 400);
    assert.equal((await comment(null, ticketA._id, "x")).status, 401);
  });
});

describe("INT-10 Staff status filtering and overview data (GET /api/tickets/all)", () => {
  before(async () => {
    const ticket = await submitTicket(studentC, { title: "Monitor has dead pixels" });
    await api("PATCH", `/api/tickets/${ticket._id}/status`, {
      token: staff.token,
      body: { status: "In Progress" },
    });
  });

  test("INT-10a per-status counts from the API equal the database counts and sum to the total", async () => {
    const res = await api("GET", "/api/tickets/all", { token: staff.token });
    assert.equal(res.status, 200);

    const apiCounts = { Open: 0, "In Progress": 0, Closed: 0 };
    for (const t of res.body) apiCounts[t.status] += 1;

    for (const status of Object.keys(apiCounts)) {
      assert.equal(apiCounts[status], await Ticket.countDocuments({ status }), status);
    }
    assert.equal(res.body.length, await Ticket.countDocuments());
    assert.equal(apiCounts.Open + apiCounts["In Progress"] + apiCounts.Closed, res.body.length);
    assert.ok(apiCounts.Open > 0 && apiCounts["In Progress"] > 0 && apiCounts.Closed > 0);
    assert.ok(new Set(res.body.map((t) => t.studentId.email)).size >= 3, "tickets from 3 students");
  });

  test("INT-10b the API always returns the full set; a status query parameter does not shrink the totals", async () => {
    const all = await api("GET", "/api/tickets/all", { token: staff.token });
    const filtered = await api("GET", "/api/tickets/all?status=Open", { token: staff.token });
    assert.equal(filtered.status, 200);
    assert.equal(filtered.body.length, all.body.length);
  });
});
