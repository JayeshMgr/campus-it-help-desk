/*
 * tests/nfr/run-nfr-tests.js
 * Milestone 3, Section 8 - automated parts of the nonfunctional tests.
 *
 *   NFR-02 Performance   - API timings and full browser workflow timings (repeated runs)
 *   NFR-03 Reliability   - data saved, application process stopped and restarted, data still there
 *   NFR-04 Security      - extra HTTP probes (integration tests INT-02..INT-09 cover the rest)
 *   NFR-05 Compatibility - environment versions + smoke test in Microsoft Edge
 *
 * NFR-01 (usability with a real participant) and NFR-06 (maintainability review)
 * cannot be automated; see docs/testing/nonfunctional-test-results.md.
 *
 * Uses the real server.js process and an isolated local MongoDB database
 * (campus_it_help_desk_m3final_nfr_test). Atlas and server/.env are not used.
 * Results: docs/testing/evidence/nfr-results.json
 *
 * Run: npm run test:nfr
 */

const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const net = require("node:net");
const mongoose = require("mongoose");
const { chromium } = require("playwright-core");

const {
  testMongoUri,
  randomSecret,
  randomPassword,
  testEmail,
  createStaffAccount,
  makeApi,
  startServerProcess,
} = require("../support/testEnv");

const User = require("../../models/User");

const PORT = Number(process.env.NFR_TEST_PORT || 5088);
const BASE = `http://127.0.0.1:${PORT}`;
const MONGO_URI = testMongoUri("nfr");
const JWT_SECRET = randomSecret();
const API_RUNS = 10;
const BROWSER_RUNS = 5;
const LIMIT_MS = 5000;
const EVIDENCE = path.join(__dirname, "..", "..", "..", "docs", "testing", "evidence");

const student = { email: testEmail("nfr.student"), password: randomPassword() };
const otherStudent = { email: testEmail("nfr.other"), password: randomPassword() };
const staff = { email: testEmail("nfr.it.staff"), password: randomPassword() };

const api = makeApi(BASE);
const results = { generatedAt: new Date().toISOString(), environment: {}, performance: {}, reliability: {}, security: [], compatibility: {} };
let serverProcess;

function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const round = (n) => Math.round(n * 10) / 10;
  return {
    runs: samples.length,
    minMs: round(sorted[0]),
    medianMs: round(sorted[Math.floor(sorted.length / 2)]),
    maxMs: round(sorted.at(-1)),
    allMs: samples.map(round),
    withinLimit: sorted.at(-1) < LIMIT_MS,
  };
}

async function loginApi(account) {
  const res = await api("POST", "/api/auth/login", { body: { email: account.email, password: account.password } });
  assert.equal(res.status, 200);
  account.token = res.body.token;
  account.id = res.body.user.id;
  return res;
}

function portIsClosed(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => { socket.destroy(); resolve(false); });
    socket.once("error", () => resolve(true));
  });
}

before(async () => {
  await mongoose.connect(MONGO_URI);
  await mongoose.connection.dropDatabase();
  await User.createIndexes();
  await createStaffAccount(User, staff.email, staff.password);

  serverProcess = startServerProcess({ mongoUri: MONGO_URI, jwtSecret: JWT_SECRET, port: PORT });
  await serverProcess.ready;
  await api("POST", "/api/auth/register", { body: { email: student.email, password: student.password } });
  await api("POST", "/api/auth/register", { body: { email: otherStudent.email, password: otherStudent.password } });

  const cpu = os.cpus()[0];
  results.environment = {
    os: `${os.version()} (${os.release()}, ${os.arch()})`,
    cpu: `${cpu.model} x ${os.cpus().length}`,
    memoryGB: Math.round(os.totalmem() / 1024 ** 3),
    node: process.version,
    database: "Local MongoDB on 127.0.0.1 (isolated test database)",
  };
});

after(async () => {
  await serverProcess?.stop();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  fs.writeFileSync(path.join(EVIDENCE, "nfr-results.json"), JSON.stringify(results, null, 2));
});

describe("NFR-02 Performance (limit: each operation < 5 s)", () => {
  test(`NFR-02a API timings over ${API_RUNS} runs: login, ticket submission, student view, staff view`, async () => {
    const samples = { login: [], submitTicket: [], viewOwnTickets: [], staffViewAll: [] };
    await loginApi(staff);
    for (let i = 0; i < API_RUNS; i += 1) {
      samples.login.push((await loginApi(student)).ms);
      const submit = await api("POST", "/api/tickets", {
        token: student.token,
        body: { title: `Perf ticket ${i + 1}`, category: "Performance", description: "Timing run." },
      });
      assert.equal(submit.status, 201);
      samples.submitTicket.push(submit.ms);
      const mine = await api("GET", "/api/tickets/mine", { token: student.token });
      assert.equal(mine.status, 200);
      samples.viewOwnTickets.push(mine.ms);
      const all = await api("GET", "/api/tickets/all", { token: staff.token });
      assert.equal(all.status, 200);
      samples.staffViewAll.push(all.ms);
    }
    results.performance.api = Object.fromEntries(Object.entries(samples).map(([k, v]) => [k, summarize(v)]));
    for (const [name, s] of Object.entries(results.performance.api)) {
      console.log(`# API ${name}: median ${s.medianMs} ms, max ${s.maxMs} ms`);
      assert.ok(s.withinLimit, `${name} exceeded ${LIMIT_MS} ms`);
    }
  });

  test(`NFR-02b browser workflow timings over ${BROWSER_RUNS} runs (Chrome): login, submit, view`, async () => {
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    results.environment.chrome = browser.version();
    const samples = { loginToDashboard: [], submitTicketUntilListed: [], openDashboardUntilListed: [] };
    try {
      for (let i = 0; i < BROWSER_RUNS; i += 1) {
        const context = await browser.newContext();
        const page = await context.newPage();
        page.on("dialog", (d) => d.accept());

        await page.goto(`${BASE}/login.html`);
        await page.fill("#email", student.email);
        await page.fill("#password", student.password);
        let start = performance.now();
        await Promise.all([page.waitForURL("**/student.html"), page.click("#loginButton")]);
        await page.locator(".student-ticket").first().waitFor();
        samples.loginToDashboard.push(performance.now() - start);

        const title = `Browser perf ticket ${i + 1}`;
        await page.fill("#ticket-title", title);
        await page.fill("#ticket-category", "Performance");
        await page.fill("#ticket-description", "Browser timing run.");
        start = performance.now();
        await page.click(".student-submit-button");
        await page.locator(".student-ticket h3", { hasText: title }).waitFor();
        samples.submitTicketUntilListed.push(performance.now() - start);

        start = performance.now();
        await page.reload();
        await page.locator(".student-ticket").first().waitFor();
        samples.openDashboardUntilListed.push(performance.now() - start);

        await context.close();
      }
    } finally {
      await browser.close();
    }
    results.performance.browser = Object.fromEntries(Object.entries(samples).map(([k, v]) => [k, summarize(v)]));
    for (const [name, s] of Object.entries(results.performance.browser)) {
      console.log(`# Browser ${name}: median ${s.medianMs} ms, max ${s.maxMs} ms`);
      assert.ok(s.withinLimit, `${name} exceeded ${LIMIT_MS} ms`);
    }
  });
});

describe("NFR-03 Reliability (data survives closing and reopening the system)", () => {
  test("NFR-03a ticket, status, and notes are still available after the server process is restarted", async () => {
    await loginApi(student);
    await loginApi(staff);
    const created = await api("POST", "/api/tickets", {
      token: student.token,
      body: { title: "Persistence check ticket", category: "Reliability", description: "Must survive a restart." },
    });
    await api("PATCH", `/api/tickets/${created.body._id}/resolve`, {
      token: staff.token,
      body: { comment: "Resolution saved before restart." },
    });
    const beforeRestart = (await api("GET", "/api/tickets/mine", { token: student.token })).body;
    const firstPid = serverProcess.child.pid;

    await serverProcess.stop();
    const closed = await portIsClosed(PORT);
    assert.equal(closed, true, "server should be fully stopped");
    const unreachable = await api("GET", "/api/tickets/mine", { token: student.token }).then(() => false, () => true);
    assert.equal(unreachable, true, "API must be unreachable while stopped");

    serverProcess = startServerProcess({ mongoUri: MONGO_URI, jwtSecret: JWT_SECRET, port: PORT });
    await serverProcess.ready;
    const secondPid = serverProcess.child.pid;

    await loginApi(student);
    const afterRestart = (await api("GET", "/api/tickets/mine", { token: student.token })).body;
    const ticket = afterRestart.find((t) => t._id === created.body._id);

    assert.notEqual(firstPid, secondPid);
    assert.equal(afterRestart.length, beforeRestart.length);
    assert.deepEqual(afterRestart.map((t) => t._id).sort(), beforeRestart.map((t) => t._id).sort());
    assert.equal(ticket.title, "Persistence check ticket");
    assert.equal(ticket.status, "Closed");
    assert.equal(ticket.comments.find((c) => c.type === "resolution").text, "Resolution saved before restart.");

    results.reliability = {
      ticketsBeforeRestart: beforeRestart.length,
      ticketsAfterRestart: afterRestart.length,
      sameTicketIds: true,
      serverStoppedPortClosed: closed,
      apiUnreachableWhileStopped: unreachable,
      processIdsDiffer: firstPid !== secondPid,
      checkedTicket: { status: ticket.status, resolutionNotePresent: true, loginAfterRestart: "200 OK" },
    };
  });
});

describe("NFR-04 Security and privacy - additional HTTP probes", () => {
  function record(probe, res, expected) {
    results.security.push({ probe, expected, actualStatus: res.status, actualMessage: res.body?.message ?? null });
  }

  test("NFR-04a a student token is rejected on every staff-only endpoint", async () => {
    await loginApi(student);
    const ticket = (await api("GET", "/api/tickets/mine", { token: student.token })).body[0];
    const probes = [
      ["GET", "/api/tickets/all", undefined],
      ["PATCH", `/api/tickets/${ticket._id}/status`, { status: "Closed" }],
      ["PATCH", `/api/tickets/${ticket._id}/resolve`, { comment: "self-resolve" }],
    ];
    for (const [method, url, body] of probes) {
      const res = await api(method, url, { token: student.token, body });
      record(`student ${method} ${url.replace(ticket._id, ":id")}`, res, 403);
      assert.equal(res.status, 403);
    }
  });

  test("NFR-04b a token whose payload was edited to role=staff (without re-signing) is rejected", async () => {
    const [header, payload, signature] = student.token.split(".");
    const edited = JSON.parse(Buffer.from(payload, "base64url").toString());
    edited.role = "staff";
    const tampered = [header, Buffer.from(JSON.stringify(edited)).toString("base64url"), signature].join(".");
    const res = await api("GET", "/api/tickets/all", { token: tampered });
    record("tampered role claim on GET /all", res, 401);
    assert.equal(res.status, 401);
  });

  test("NFR-04c an unsigned token (alg: none) is rejected", async () => {
    const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const unsigned = `${enc({ alg: "none", typ: "JWT" })}.${enc({ userId: student.id, role: "staff" })}.`;
    const res = await api("GET", "/api/tickets/all", { token: unsigned });
    record("alg:none token on GET /all", res, 401);
    assert.equal(res.status, 401);
  });

  test("NFR-04d a MongoDB operator in the login email does not log anyone in", async () => {
    const res = await api("POST", "/api/auth/login", { body: { email: { $ne: null }, password: "guess" } });
    record("login with email {$ne:null}", res, "no token (401)");
    assert.notEqual(res.status, 200);
    assert.equal(res.body?.token, undefined);
  });

  test("NFR-04e another student cannot read, comment on, or reopen a ticket they do not own", async () => {
    await loginApi(otherStudent);
    const target = (await api("GET", "/api/tickets/mine", { token: student.token })).body
      .find((t) => t.status === "Closed");

    const mine = await api("GET", "/api/tickets/mine", { token: otherStudent.token });
    record("other student GET /mine contains owner's ticket?", { status: mine.status, body: { message: `${mine.body.length} tickets returned` } }, "200 with 0 of owner's tickets");
    assert.equal(mine.body.some((t) => t._id === target._id), false);

    const reopen = await api("PATCH", `/api/tickets/${target._id}/reopen`, { token: otherStudent.token, body: { comment: "x" } });
    record("other student reopen", reopen, 404);
    assert.equal(reopen.status, 404);

    const comment = await api("POST", `/api/tickets/${target._id}/comments`, { token: otherStudent.token, body: { comment: "x" } });
    record("other student comment", comment, 404);
    assert.equal(comment.status, 404);
  });

  test("NFR-04f responses never contain password hashes", async () => {
    await loginApi(staff);
    const all = await api("GET", "/api/tickets/all", { token: staff.token });
    const login = await api("POST", "/api/auth/login", { body: { email: student.email, password: student.password } });
    const leaked = /\$2[aby]\$/.test(all.text) || /\$2[aby]\$/.test(login.text) || login.text.includes(student.password);
    results.security.push({ probe: "password/hash in GET /all or login responses", expected: "none", actualStatus: leaked ? "LEAKED" : "none found", actualMessage: null });
    assert.equal(leaked, false);
  });
});

describe("NFR-05 Compatibility", () => {
  test("NFR-05a smoke test in Microsoft Edge: login, submit ticket, view list, logout", async () => {
    const browser = await chromium.launch({ channel: "msedge", headless: true });
    results.environment.edge = browser.version();
    try {
      const page = await (await browser.newContext()).newPage();
      page.on("dialog", (d) => d.accept());
      await page.goto(`${BASE}/login.html`);
      await page.fill("#email", student.email);
      await page.fill("#password", student.password);
      await Promise.all([page.waitForURL("**/student.html"), page.click("#loginButton")]);
      await page.fill("#ticket-title", "Edge compatibility ticket");
      await page.fill("#ticket-category", "Compatibility");
      await page.fill("#ticket-description", "Submitted from Microsoft Edge.");
      await page.click(".student-submit-button");
      await page.locator(".student-ticket h3", { hasText: "Edge compatibility ticket" }).waitFor();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(EVIDENCE, "screenshots", "nfr-05-edge-student-dashboard.png") });
      await page.click("text=Log out");
      await page.waitForURL("**/login.html");
      results.compatibility.edgeSmoke = "PASS";
    } finally {
      await browser.close();
    }
    results.compatibility.chromeFullSystemSuite = "See system-test-output.txt";
  });
});
