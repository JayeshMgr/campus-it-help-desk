const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const authMiddleware = require("../middlewares/authMiddleware");

// A fake secret used only by these tests. The real .env is never loaded.
const TEST_SECRET = "unit-test-secret";
let originalSecret;

before(() => {
  originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;
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

// Runs the middleware with the given Authorization header and reports
// whether next() was called.
function runMiddleware(authorizationHeader) {
  const req = { headers: {} };
  if (authorizationHeader !== undefined) {
    req.headers.authorization = authorizationHeader;
  }
  const res = fakeRes();

  let nextCalled = false;
  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  return { req, res, nextCalled };
}

// Test 1: A valid token lets the request through
test("Valid JWT permits access and sets req.user", () => {
  const token = jwt.sign({ userId: "user123", role: "student" }, TEST_SECRET, {
    expiresIn: "1h",
  });

  const { req, res, nextCalled } = runMiddleware(`Bearer ${token}`);

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
  assert.equal(req.user.userId, "user123");
  assert.equal(req.user.role, "student");
});

// Test 2: No Authorization header at all
test("Missing Authorization header is rejected with 401", () => {
  const { res, nextCalled } = runMiddleware(undefined);

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Access denied. No token provided");
});

// Test 3: Header exists but does not start with "Bearer "
test("Malformed Authorization header is rejected with 401", () => {
  const token = jwt.sign({ userId: "user123", role: "student" }, TEST_SECRET);

  const { res, nextCalled } = runMiddleware(`Basic ${token}`);

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Access denied. No token provided");
});

// Test 4: Token signed with a different secret (forged or tampered)
test("Invalid JWT is rejected with 401", () => {
  const forgedToken = jwt.sign({ userId: "user123", role: "staff" }, "wrong-secret");

  const { req, res, nextCalled } = runMiddleware(`Bearer ${forgedToken}`);

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Invalid or expired token");
  assert.equal(req.user, undefined);
});

// Test 5: Token whose expiry time has already passed
test("Expired JWT is rejected with 401", () => {
  // exp is set 60 seconds in the past
  const expiredToken = jwt.sign(
    {
      userId: "user123",
      role: "student",
      exp: Math.floor(Date.now() / 1000) - 60,
    },
    TEST_SECRET,
  );

  const { res, nextCalled } = runMiddleware(`Bearer ${expiredToken}`);

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Invalid or expired token");
});
