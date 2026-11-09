/*
 * tests/system/run-system-tests.js
 * Milestone 3, Section 7.2 - Browser-based system / end-to-end tests SYS-01 to SYS-14.
 *
 * Drives the real Navy & Ice Blue UI in headless Google Chrome (playwright-core,
 * using the Chrome already installed on this computer). The real server.js
 * runs as a separate process against an isolated local MongoDB database
 * (campus_it_help_desk_m3final_sys_test). Atlas and server/.env are not used.
 *
 * Run: npm run test:system
 * Screenshots: docs/testing/evidence/screenshots/
 */

const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
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
const Ticket = require("../../models/Ticket");

const PORT = Number(process.env.SYSTEM_TEST_PORT || 5077);
const BASE = `http://127.0.0.1:${PORT}`;
const MONGO_URI = testMongoUri("sys");
const JWT_SECRET = randomSecret();
const SHOTS = path.join(__dirname, "..", "..", "..", "docs", "testing", "evidence", "screenshots");

const studentA = { email: testEmail("sys.student.a"), password: randomPassword() };
const studentB = { email: testEmail("sys.student.b"), password: randomPassword() };
const staff = { email: testEmail("sys.it.staff"), password: randomPassword() };

const TICKET_A1 = { title: "Campus Wi-Fi keeps disconnecting", category: "Network", description: "Drops every 5 minutes in the library." };
const TICKET_A2 = { title: "Need Microsoft Office license", category: "Software", description: "Office says my license expired." };
const TICKET_B1 = { title: "Lab PC monitor is blank", category: "Hardware", description: "Engineering lab PC 14 shows no signal." };

let serverProcess;
let browser;
let context;
let page;
let api;
const dialogs = [];

async function shot(name) {
  // Full-page captures of a scrolled page draw the sticky header mid-image.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

async function lastDialog() {
  return dialogs.at(-1);
}

// Opens a fresh tab with an empty sessionStorage, like a new browser window.
async function newPage() {
  if (page) await page.close();
  page = await context.newPage();
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.accept();
  });
}

async function loginThroughUi(account, expectedPage) {
  await page.goto(`${BASE}/login.html`);
  await page.fill("#email", account.email);
  await page.fill("#password", account.password);
  await Promise.all([page.waitForURL(`**/${expectedPage}`), page.click("#loginButton")]);
}

async function readCounts() {
  return page.evaluate(() => ({
    total: Number(document.getElementById("total-count").textContent),
    open: Number(document.getElementById("open-count").textContent),
    progress: Number(document.getElementById("progress-count").textContent),
    closed: Number(document.getElementById("closed-count").textContent),
  }));
}

async function waitForStaffList() {
  await page.waitForFunction(() => !document.getElementById("ticket-list").textContent.includes("Loading"));
}

function staffCard(title) {
  return page.locator(".ticket-card", { has: page.locator(".ticket-title", { hasText: title }) });
}

function studentCard(title) {
  return page.locator(".student-ticket", { has: page.locator("h3", { hasText: title }) });
}

before(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });

  await mongoose.connect(MONGO_URI);
  await mongoose.connection.dropDatabase();
  await User.createIndexes();
  await createStaffAccount(User, staff.email, staff.password);

  serverProcess = startServerProcess({ mongoUri: MONGO_URI, jwtSecret: JWT_SECRET, port: PORT });
  await serverProcess.ready;
  api = makeApi(BASE);

  browser = await chromium.launch({ channel: "chrome", headless: true });
  context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await newPage();
  console.log(`# Browser: Google Chrome ${browser.version()} (headless)`);
});

after(async () => {
  await browser?.close();
  await serverProcess?.stop();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("System tests (real browser + real server + isolated test database)", () => {
  test("SYS-01 student registers through register.html and is sent to the login page", async () => {
    await page.goto(`${BASE}/index.html`);
    await shot("sys-01a-home");
    await Promise.all([page.waitForURL("**/register.html"), page.click("text=Create Student Account")]);

    await page.fill("#email", studentA.email);
    await page.fill("#password", studentA.password);
    await shot("sys-01b-register-filled");
    await Promise.all([page.waitForURL("**/login.html"), page.click("#registerButton")]);

    const stored = await User.findOne({ email: studentA.email }).lean();
    assert.equal(stored.role, "student");
    assert.notEqual(stored.password, studentA.password);
  });

  test("SYS-02 registering an email that already exists shows an error and stays on the page", async () => {
    await page.goto(`${BASE}/register.html`);
    await page.fill("#email", studentA.email);
    await page.fill("#password", randomPassword());
    await page.click("#registerButton");
    await page.waitForFunction(() => document.getElementById("errorMessage").textContent.length > 0);

    assert.equal(await page.textContent("#errorMessage"), "User already exists");
    assert.ok(page.url().endsWith("/register.html"));
    await shot("sys-02-register-duplicate");
  });

  test("SYS-03 login with a wrong password shows 'Invalid credentials' and does not log in", async () => {
    await page.goto(`${BASE}/login.html`);
    await page.fill("#email", studentA.email);
    await page.fill("#password", "Wrong-password-1");
    await page.click("#loginButton");
    await page.waitForFunction(() => document.getElementById("errorMessage").textContent.length > 0);

    assert.equal(await page.textContent("#errorMessage"), "Invalid credentials");
    assert.equal(await page.evaluate(() => sessionStorage.getItem("token")), null);
    await shot("sys-03-login-invalid");
  });

  test("SYS-04 student logs in and lands on the student dashboard with no tickets", async () => {
    await loginThroughUi(studentA, "student.html");
    await page.waitForFunction(() => document.getElementById("request-list").textContent.includes("no IT requests found"));

    assert.equal(await page.evaluate(() => sessionStorage.getItem("role")), "student");
    await shot("sys-04-student-dashboard-empty");
  });

  test("SYS-05 student submits tickets through the form and they appear with status Open", async () => {
    for (const t of [TICKET_A1, TICKET_A2]) {
      await page.fill("#ticket-title", t.title);
      await page.fill("#ticket-category", t.category);
      await page.fill("#ticket-description", t.description);
      await page.click(".student-submit-button");
      await studentCard(t.title).waitFor();
    }

    assert.equal(await lastDialog(), "Ticket submitted successfully.");
    assert.equal(await studentCard(TICKET_A1.title).locator(".status-badge").textContent(), "Open");
    assert.equal(await Ticket.countDocuments({ title: TICKET_A1.title }), 1);
    await shot("sys-05a-student-submitted");
  });

  test("SYS-06 submitting with an empty required field is blocked and nothing is saved", async () => {
    const before = await Ticket.countDocuments();
    await page.fill("#ticket-title", "Missing description");
    await page.fill("#ticket-category", "Other");
    await page.fill("#ticket-description", "");
    await page.click(".student-submit-button");
    await page.waitForTimeout(500);

    const invalid = await page.evaluate(() => !document.getElementById("ticket-form").checkValidity());
    assert.equal(invalid, true);
    assert.equal(await Ticket.countDocuments(), before);
    await shot("sys-06-required-field-blocked");
    await page.fill("#ticket-title", "");
    await page.fill("#ticket-category", "");
  });

  test("SYS-07 a second student sees only their own tickets", async () => {
    await api("POST", "/api/auth/register", { body: { email: studentB.email, password: studentB.password } });
    await newPage();
    await loginThroughUi(studentB, "student.html");
    await page.fill("#ticket-title", TICKET_B1.title);
    await page.fill("#ticket-category", TICKET_B1.category);
    await page.fill("#ticket-description", TICKET_B1.description);
    await page.click(".student-submit-button");
    await studentCard(TICKET_B1.title).waitFor();

    const text = await page.textContent("#request-list");
    assert.equal(text.includes(TICKET_A1.title), false);
    assert.equal(text.includes(TICKET_A2.title), false);
    assert.equal(await page.locator(".student-ticket").count(), 1);
    await shot("sys-07-student-b-own-tickets");
  });

  test("SYS-08 staff log in and see all tickets with each submitter's email and correct overview counts", async () => {
    await newPage();
    await loginThroughUi(staff, "admin.html");
    await waitForStaffList();

    assert.equal(await page.locator(".ticket-card").count(), 3);
    assert.match(await staffCard(TICKET_A1.title).textContent(), new RegExp(`Submitted by: ${studentA.email}`));
    assert.match(await staffCard(TICKET_B1.title).textContent(), new RegExp(`Submitted by: ${studentB.email}`));
    assert.deepEqual(await readCounts(), { total: 3, open: 3, progress: 0, closed: 0 });
    await shot("sys-08-staff-dashboard-all");
  });

  test("SYS-09 staff change a ticket to In Progress; the card and the counts update", async () => {
    const card = staffCard(TICKET_A1.title);
    await card.locator("select").selectOption("In Progress");
    await card.locator(".update-button").click();
    await page.waitForFunction(() => document.getElementById("progress-count").textContent === "1");

    assert.match(await staffCard(TICKET_A1.title).locator(".status-badge").textContent(), /In Progress/);
    assert.deepEqual(await readCounts(), { total: 3, open: 2, progress: 1, closed: 0 });
    assert.equal((await Ticket.findOne({ title: TICKET_A1.title }).lean()).status, "In Progress");
    await shot("sys-09-staff-in-progress");
  });

  test("SYS-10 staff try to close without a note (blocked), then resolve with a resolution note", async () => {
    let card = staffCard(TICKET_A1.title);
    await card.locator(".close-button").click();
    assert.equal(await lastDialog(), "Please enter a resolution comment before closing.");
    assert.equal((await Ticket.findOne({ title: TICKET_A1.title }).lean()).status, "In Progress");

    await card.locator("textarea").fill("Reset the Wi-Fi profile and updated the network driver.");
    await card.locator(".close-button").click();
    await page.waitForFunction(() => document.getElementById("closed-count").textContent === "1");

    assert.equal(dialogs.at(-1), "Close this ticket with the comment provided?");
    card = staffCard(TICKET_A1.title);
    assert.match(await card.locator(".status-badge").textContent(), /Closed/);
    assert.match(await card.locator(".comment-resolution").textContent(), /Reset the Wi-Fi profile/);
    assert.equal(await card.locator("textarea").count(), 0, "closed tickets hide the comment box");
    assert.deepEqual(await readCounts(), { total: 3, open: 2, progress: 0, closed: 1 });
    await shot("sys-10-staff-resolved");
  });

  test("SYS-11 status filter shows only matching tickets and does not change the overview totals", async () => {
    const expectedCounts = await readCounts();
    const cases = [
      ["Open", 2],
      ["In Progress", 0],
      ["Closed", 1],
      ["All", 3],
    ];
    for (const [status, expected] of cases) {
      await page.selectOption("#status-filter", status);
      await page.waitForFunction(
        (n) => n === 0
          ? document.getElementById("ticket-list").textContent.includes("No tickets found")
          : document.querySelectorAll(".ticket-card").length === n,
        expected,
      );
      const badges = await page.locator(".ticket-card .status-badge").allTextContents();
      assert.equal(badges.length, expected, status);
      if (status !== "All") assert.ok(badges.every((b) => b === `Status: ${status}`));
      assert.deepEqual(await readCounts(), expectedCounts, `counts unchanged with filter ${status}`);
      await shot(`sys-11-filter-${status.replace(" ", "-").toLowerCase()}`);
    }

    const apiAll = await api("POST", "/api/auth/login", { body: { email: staff.email, password: staff.password } })
      .then((r) => api("GET", "/api/tickets/all", { token: r.body.token }));
    assert.equal(apiAll.body.length, expectedCounts.total);
    assert.equal(apiAll.body.filter((t) => t.status === "Closed").length, expectedCounts.closed);
  });

  test("SYS-12 student sees the Closed status and the resolution note on their dashboard", async () => {
    await newPage();
    await loginThroughUi(studentA, "student.html");
    const card = studentCard(TICKET_A1.title);
    await card.waitFor();

    assert.equal(await card.locator(".status-badge").textContent(), "Closed");
    assert.match(await card.locator(".comment-resolution").textContent(), /Resolution/);
    assert.match(await card.locator(".comment-resolution").textContent(), /Reset the Wi-Fi profile/);
    await shot("sys-12-student-sees-resolution");
  });

  test("SYS-13 student reopens the Closed ticket (explanation required); status returns to Open", async () => {
    let card = studentCard(TICKET_A1.title);
    await card.locator("button", { hasText: "Reopen Ticket" }).click();
    assert.equal(await lastDialog(), "Please explain why this ticket needs to be reopened.");
    assert.equal((await Ticket.findOne({ title: TICKET_A1.title }).lean()).status, "Closed");

    await card.locator("textarea").fill("Wi-Fi started dropping again after the update.");
    await card.locator("button", { hasText: "Reopen Ticket" }).click();
    await page.waitForFunction(
      (title) => [...document.querySelectorAll(".student-ticket")].some(
        (c) => c.querySelector("h3").textContent === title && c.querySelector(".status-badge").textContent === "Open"),
      TICKET_A1.title,
    );

    assert.equal(dialogs.at(-1), "Ticket reopened successfully.");
    card = studentCard(TICKET_A1.title);
    assert.match(await card.locator(".comment-reopen").textContent(), /Reopening Explanation/);
    assert.match(await card.locator(".comment-reopen").textContent(), /dropping again/);
    const stored = await Ticket.findOne({ title: TICKET_A1.title }).lean();
    assert.equal(stored.status, "Open");
    assert.equal(stored.comments.at(-1).type, "reopen");
    await shot("sys-13-student-reopened");
  });

  test("SYS-14 logout clears the session; protected pages afterwards do not show ticket data", async () => {
    await page.click("text=Log out");
    await page.waitForURL("**/login.html");
    assert.equal(await page.evaluate(() => sessionStorage.getItem("token")), null);

    // Staff dashboard has a page guard and redirects to login.
    await page.goto(`${BASE}/admin.html`);
    await page.waitForURL("**/login.html");

    // Student dashboard after logout: record what the page actually does.
    await page.goto(`${BASE}/student.html`);
    await page.waitForFunction(() => !document.getElementById("request-list").textContent.includes("Loading"));
    const listText = await page.textContent("#request-list");
    const url = page.url();
    console.log(`# SYS-14 observation: student.html after logout -> url=${url.replace(BASE, "")}, list="${listText.trim()}"`);
    await shot("sys-14-student-page-after-logout");

    assert.equal(listText.includes(TICKET_A1.title), false, "no ticket data after logout");
    assert.equal(listText.includes(TICKET_A2.title), false, "no ticket data after logout");

    // A logged-in student opening the staff page is redirected to login.
    await loginThroughUi(studentA, "student.html");
    await page.goto(`${BASE}/admin.html`);
    await page.waitForURL("**/login.html");
  });
});
