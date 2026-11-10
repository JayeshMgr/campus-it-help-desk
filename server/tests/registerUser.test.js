const { test } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { registerUser } = require("../controllers/authController");

// User.findOne and User.create are replaced with t.mock.method() in each
// test, so no MongoDB connection is needed. Node restores the real
// methods automatically when each test finishes.

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

// Mocks a successful registration: no existing user, and create() returns
// the saved user with an _id and the default "student" role.
function mockSuccessfulRegistration(t) {
  t.mock.method(User, "findOne", async () => null);
  return t.mock.method(User, "create", async (data) => ({
    _id: "newUserId",
    email: data.email,
    password: data.password,
    role: "student",
  }));
}

// Test 1: Normal registration
test("Valid registration returns 201 with the student role", async (t) => {
  mockSuccessfulRegistration(t);
  const req = { body: { email: "student@example.edu", password: "Password1" } };
  const res = fakeRes();

  await registerUser(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.message, "User created successfully");
  assert.equal(res.body.user.id, "newUserId");
  assert.equal(res.body.user.email, "student@example.edu");
  assert.equal(res.body.user.role, "student");
});

// Test 2: Missing email or missing password
test("Missing email or password returns 400", async (t) => {
  const findOne = t.mock.method(User, "findOne", async () => null);
  const create = t.mock.method(User, "create", async () => ({}));

  const missingFields = [
    { password: "Password1" },
    { email: "student@example.edu" },
    { email: "", password: "" },
  ];

  for (const body of missingFields) {
    const res = fakeRes();

    await registerUser({ body }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Email and password are required");
  }

  // The function should stop before touching the database.
  assert.equal(findOne.mock.callCount(), 0);
  assert.equal(create.mock.callCount(), 0);
});

// Test 3: Email already registered
test("Duplicate email is rejected and no user is created", async (t) => {
  t.mock.method(User, "findOne", async () => ({
    _id: "existingUserId",
    email: "student@example.edu",
  }));
  const create = t.mock.method(User, "create", async () => ({}));
  const req = { body: { email: "student@example.edu", password: "Password1" } };
  const res = fakeRes();

  await registerUser(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "User already exists");
  assert.equal(create.mock.callCount(), 0);
});

// Test 4: The value saved to the database is a bcrypt hash
test("Password is hashed before saving", async (t) => {
  const create = mockSuccessfulRegistration(t);
  const plainPassword = "Password1";
  const req = { body: { email: "student@example.edu", password: plainPassword } };

  await registerUser(req, fakeRes());

  assert.equal(create.mock.callCount(), 1);
  const savedPassword = create.mock.calls[0].arguments[0].password;

  assert.notEqual(savedPassword, plainPassword);
  assert.equal(await bcrypt.compare(plainPassword, savedPassword), true);
});

// Test 5: The response body never includes the password or its hash
test("Response does not expose the password", async (t) => {
  mockSuccessfulRegistration(t);
  const plainPassword = "Password1";
  const req = { body: { email: "student@example.edu", password: plainPassword } };
  const res = fakeRes();

  await registerUser(req, res);

  assert.equal("password" in res.body.user, false);
  const responseText = JSON.stringify(res.body);
  assert.equal(responseText.includes(plainPassword), false);
  assert.equal(responseText.includes("$2"), false, "bcrypt hash should not be returned");
});

// Test 6: Database error goes to the catch block
test("Database error returns 500 with a generic message", async (t) => {
  t.mock.method(User, "findOne", async () => {
    throw new Error("simulated database failure");
  });
  const req = { body: { email: "student@example.edu", password: "Password1" } };
  const res = fakeRes();

  await registerUser(req, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.message, "Internal server error");
});
