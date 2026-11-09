/*
 * tests/support/testEnv.js
 * Shared setup for the integration, system, and nonfunctional test scripts.
 *
 * Safety rules enforced here:
 * - Only a local MongoDB (mongodb://127.0.0.1 or localhost) is allowed.
 *   Atlas (mongodb+srv://) and remote hosts are refused.
 * - The database name must match campus_it_help_desk_m3final_<suite>_test,
 *   so the project database and older test databases can never be dropped.
 * - server/.env is never read. JWT_SECRET is generated randomly per run.
 * - Test passwords are generated randomly and never written to evidence files.
 */

const crypto = require("node:crypto");
const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const bcrypt = require("bcryptjs");

const MONGO_HOST = process.env.TEST_MONGO_HOST || "mongodb://127.0.0.1:27017";
const DB_NAME_PATTERN = /^campus_it_help_desk_m3final_[a-z]+_test$/;
const SERVER_DIR = path.join(__dirname, "..", "..");

function testMongoUri(suite) {
  const uri = `${MONGO_HOST}/campus_it_help_desk_m3final_${suite}_test`;
  assertSafeTestUri(uri);
  return uri;
}

function assertSafeTestUri(uri) {
  const match = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/([^/?]+)$/.exec(uri);
  if (!match) {
    throw new Error("Refusing to run: test database must be a local mongodb:// URI");
  }
  if (!DB_NAME_PATTERN.test(match[3])) {
    throw new Error(`Refusing to run: database "${match[3]}" is not an m3final test database`);
  }
}

function randomSecret() {
  return crypto.randomBytes(32).toString("hex");
}

// Random password that satisfies any reasonable password rule.
function randomPassword() {
  return `Tp-${crypto.randomBytes(9).toString("base64url")}9a`;
}

// Fictional addresses on the reserved .test domain; never real student data.
function testEmail(label) {
  return `${label}.${crypto.randomBytes(3).toString("hex")}@example.test`;
}

// Staff accounts cannot be created through the API (registration always
// assigns "student"), so they are inserted directly into the test database,
// the same way staff accounts are provisioned for the real system.
async function createStaffAccount(User, email, password) {
  const user = await User.create({
    email,
    password: await bcrypt.hash(password, 10),
    role: "staff",
  });
  return user;
}

// Small fetch wrapper that records status, parsed JSON, and elapsed time.
function makeApi(baseUrl) {
  return async function api(method, urlPath, { token, body, headers = {} } = {}) {
    const requestHeaders = { ...headers };
    if (body !== undefined) requestHeaders["Content-Type"] = "application/json";
    if (token) requestHeaders.Authorization = `Bearer ${token}`;

    const start = performance.now();
    const response = await fetch(`${baseUrl}${urlPath}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    const ms = performance.now() - start;

    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { status: response.status, body: json, text, ms };
  };
}

// Starts the real server.js as a separate process, the way `npm start` does.
// The working directory is an empty temp folder so dotenv cannot find
// server/.env; all configuration comes from the variables passed here.
function startServerProcess({ mongoUri, jwtSecret, port }) {
  const emptyCwd = fs.mkdtempSync(path.join(os.tmpdir(), "helpdesk-test-"));
  const child = spawn(process.execPath, [path.join(SERVER_DIR, "server.js")], {
    cwd: emptyCwd,
    env: { ...process.env, MONGO_URI: mongoUri, JWT_SECRET: jwtSecret, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));

  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Server did not start:\n${log}`)), 20000);
    child.stdout.on("data", () => {
      if (log.includes(`Server running on port ${port}`)) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Server exited early with code ${code}:\n${log}`));
    });
  });

  async function stop() {
    if (child.exitCode !== null) return;
    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill();
    await exited;
  }

  return { child, ready, stop, getLog: () => redact(log, [mongoUri, jwtSecret]) };
}

// Removes secrets from any text before it is written to an evidence file.
function redact(text, secrets = []) {
  let result = String(text);
  for (const secret of secrets) {
    if (secret) result = result.split(secret).join("[REDACTED]");
  }
  return result
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[JWT REDACTED]")
    .replace(/\$2[aby]\$\d{2}\$[./\w]{53}/g, "[BCRYPT HASH REDACTED]")
    .replace(/mongodb(\+srv)?:\/\/[^\s"']+/g, "[MONGO URI REDACTED]");
}

module.exports = {
  testMongoUri,
  assertSafeTestUri,
  randomSecret,
  randomPassword,
  testEmail,
  createStaffAccount,
  makeApi,
  startServerProcess,
  redact,
  SERVER_DIR,
};
