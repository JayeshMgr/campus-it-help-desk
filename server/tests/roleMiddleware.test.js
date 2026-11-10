const { test } = require("node:test");
const assert = require("node:assert/strict");

const roleMiddleware = require("../middlewares/roleMiddleware");

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

// Test 1: Staff should be allowed
test("Staff can access staff-only routes", () => {
  const req = { user: { role: "staff" } };
  const res = fakeRes();

  let nextCalled = false;

  roleMiddleware("staff")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});

// Test 2: Student should be denied
test("Student cannot access staff-only routes", () => {
  const req = { user: { role: "student" } };
  const res = fakeRes();

  let nextCalled = false;

  roleMiddleware("staff")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

// Test 3: Missing user should be denied
test("Request without user information is denied", () => {
  const req = {};
  const res = fakeRes();

  let nextCalled = false;

  roleMiddleware("staff")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});
