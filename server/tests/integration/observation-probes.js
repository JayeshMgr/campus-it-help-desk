/*
 * tests/integration/observation-probes.js
 * Records the ACTUAL behaviour of the API for inputs where the requirement
 * (SRS not available in the repository) may or may not define a rule.
 * These are observations, not pass/fail tests. The team decides whether
 * each one is acceptable or a defect.
 *
 * Real Express app + isolated local MongoDB (campus_it_help_desk_m3final_probe_test).
 * Run: node tests/integration/observation-probes.js
 */

const mongoose = require("mongoose");
const {
  testMongoUri,
  randomSecret,
  randomPassword,
  testEmail,
  createStaffAccount,
  makeApi,
} = require("../support/testEnv");

const MONGO_URI = testMongoUri("probe");
process.env.JWT_SECRET = randomSecret();

const app = require("../../app");
const User = require("../../models/User");

async function main() {
  await mongoose.connect(MONGO_URI);
  await mongoose.connection.dropDatabase();
  await User.createIndexes();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const api = makeApi(base);
  const rows = [];
  const record = (id, probe, res, note = "") =>
    rows.push({ id, probe, status: res.status, message: res.body?.message ?? (Array.isArray(res.body) ? `${res.body.length} items` : ""), note });

  try {
    record("OBS-P1", "Register email without '@' ('not-an-email')",
      await api("POST", "/api/auth/register", { body: { email: "not-an-email", password: randomPassword() } }));
    record("OBS-P2", "Register with a 1-character password",
      await api("POST", "/api/auth/register", { body: { email: testEmail("short.pw"), password: "a" } }));

    const mixed = `Case.Student.${Date.now()}@Example.test`;
    await api("POST", "/api/auth/register", { body: { email: mixed, password: randomPassword() } });
    record("OBS-P3", "Register the same email in lower case after a mixed-case registration",
      await api("POST", "/api/auth/register", { body: { email: mixed.toLowerCase(), password: randomPassword() } }));

    const student = { email: testEmail("probe.student"), password: randomPassword() };
    await api("POST", "/api/auth/register", { body: student });
    student.token = (await api("POST", "/api/auth/login", { body: student })).body.token;
    const staff = { email: testEmail("probe.staff"), password: randomPassword() };
    await createStaffAccount(User, staff.email, staff.password);
    staff.token = (await api("POST", "/api/auth/login", { body: staff })).body.token;

    record("OBS-P4", "Submit ticket with a 10,000-character title",
      await api("POST", "/api/tickets", { token: student.token, body: { title: "t".repeat(10000), category: "C", description: "D" } }));
    record("OBS-P5", "Submit ticket missing title - message returned to the client",
      await api("POST", "/api/tickets", { token: student.token, body: { category: "C", description: "D" } }));

    const ticket = (await api("POST", "/api/tickets", { token: student.token, body: { title: "T", category: "C", description: "D" } })).body;
    const closed = await api("PATCH", `/api/tickets/${ticket._id}/status`, { token: staff.token, body: { status: "Closed" } });
    record("OBS-P6", "Staff set status Closed via dropdown route (no resolution note)", closed,
      `resolution comments on ticket: ${closed.body.comments.filter((c) => c.type === "resolution").length}`);
    const reopened = await api("PATCH", `/api/tickets/${ticket._id}/status`, { token: staff.token, body: { status: "Open" } });
    record("OBS-P7", "Staff set a Closed ticket back to Open via dropdown route (no explanation)", reopened,
      `comments on ticket: ${reopened.body.comments.length}`);

    const raw = await fetch(`${base}/api/tickets/all`, { headers: { Authorization: `Bearer ${staff.token}`, Origin: "http://evil.example" } });
    record("OBS-P8", "Response headers on GET /api/tickets/all with a foreign Origin", { status: raw.status, body: null },
      `X-Powered-By: ${raw.headers.get("x-powered-by")}; Access-Control-Allow-Origin: ${raw.headers.get("access-control-allow-origin")}`);

    const home = await fetch(`${base}/`);
    record("OBS-P9", "GET / (app.js defines a JSON 'Hello World' route)", { status: home.status, body: null },
      `content-type: ${home.headers.get("content-type")}`);
  } finally {
    await new Promise((r) => server.close(r));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }

  console.log("| ID | Probe | HTTP status | Message | Note |");
  console.log("| --- | --- | --- | --- | --- |");
  for (const r of rows) {
    console.log(`| ${r.id} | ${r.probe} | ${r.status} | ${String(r.message).slice(0, 120)} | ${r.note} |`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
