const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { loginUser } = require("../controllers/authController");

// A fake secret used only by these tests. The real .env is never loaded.
const TEST_SECRET = "unit-test-secret";
const PLAIN_PASSWORD = "Password1";
let originalSecret;
let storedUser;

before(async () => {
  originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;

  // A fake user record, shaped like a document from MongoDB.
  // The password is a real bcrypt hash so the real bcrypt.compare runs.
  storedUser = {
    _id: "studentUserId",
    email: "student@example.edu",
    password: await bcrypt.hash(PLAIN_PASSWORD, 10),
    role: "student",
  };
});

after(() => {
  if (originalSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalSecret;
  }
});

// Fake Express response object
function fakeRes() {
  const res = {
    statusCode: null,
    body: null,
  };

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (data) => {
    res.body = data;
    return res;
  };

  return res;
}

// Test 1: Correct email and password
test("Valid credentials return 200 with a JWT", async (t) => {
  t.mock.method(User, "findOne", async () => storedUser);
  const req = { body: { email: "student@example.edu", password: PLAIN_PASSWORD } };
  const res = fakeRes();

  await loginUser(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Login Successful");
  assert.equal(typeof res.body.token, "string");
  assert.equal(res.body.user.email, "student@example.edu");
  assert.equal(res.body.user.role, "student");
  assert.equal("password" in res.body.user, false);
});

// Test 2: Right email, wrong password
test("Incorrect password is rejected with 401", async (t) => {
  t.mock.method(User, "findOne", async () => storedUser);
  const req = { body: { email: "student@example.edu", password: "WrongPassword" } };
  const res = fakeRes();

  await loginUser(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Invalid credentials");
  assert.equal(res.body.token, undefined);
});

// Test 3: Email not registered. The message matches Test 2 so an attacker
// can't tell which emails exist.
test("Unknown email is rejected with the same 401 message", async (t) => {
  t.mock.method(User, "findOne", async () => null);
  const req = { body: { email: "nobody@example.edu", password: PLAIN_PASSWORD } };
  const res = fakeRes();

  await loginUser(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Invalid credentials");
  assert.equal(res.body.token, undefined);
});

// Test 4: Missing email or password
test("Missing credentials are rejected with 400", async (t) => {
  const findOne = t.mock.method(User, "findOne", async () => storedUser);

  const missingFields = [
    { password: PLAIN_PASSWORD },
    { email: "student@example.edu" },
    {},
  ];

  for (const body of missingFields) {
    const res = fakeRes();

    await loginUser({ body }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Email and password are required");
  }

  // The function should stop before touching the database.
  assert.equal(findOne.mock.callCount(), 0);
});

// Test 5: Token payload holds the right user and role, and expires in 1 hour
test("Returned JWT contains the expected user ID and role", async (t) => {
  t.mock.method(User, "findOne", async () => storedUser);
  const req = { body: { email: "student@example.edu", password: PLAIN_PASSWORD } };
  const res = fakeRes();

  await loginUser(req, res);

  // jwt.verify throws if the token was not signed with TEST_SECRET.
  const decoded = jwt.verify(res.body.token, TEST_SECRET);

  assert.equal(decoded.userId, "studentUserId");
  assert.equal(decoded.role, "student");
  assert.equal(decoded.exp - decoded.iat, 60 * 60);
});

// Test 6: Database error goes to the catch block
test("Database error returns 500 with a generic message", async (t) => {
  t.mock.method(User, "findOne", async () => {
    throw new Error("simulated database failure");
  });
  const req = { body: { email: "student@example.edu", password: PLAIN_PASSWORD } };
  const res = fakeRes();

  await loginUser(req, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.message, "Internal server error");
});
