# Manual Tests Still To Do

These three tests need a person. All are **Not Run**. Only fill in a result after you actually do the test.

| ID | Test | Requirement |
| -- | ---- | ----------- |
| MAN-01 | Timed usability test with a new user | NFR-01 (TC-24) |
| MAN-02 | Run the system on each teammate's Windows computer | NFR-05 (TC-26) |
| MAN-03 | Visual review of the final design | Validation |

## Setup (local test database only)

Never test against MongoDB Atlas. Start the server with a local test database instead (you do not need to edit `.env`):

```powershell
cd server
$env:MONGO_URI  = "mongodb://127.0.0.1:27017/campus_it_help_desk_m3final_manual_test"
$env:JWT_SECRET = [guid]::NewGuid().ToString()
npm.cmd start
```

For MAN-02 and MAN-03 you also need a staff account. Run this in a second terminal in `server/` with the same `MONGO_URI`, and choose a temporary password:

```powershell
$env:MONGO_URI = "mongodb://127.0.0.1:27017/campus_it_help_desk_m3final_manual_test"
$env:STAFF_PW  = Read-Host "Temporary staff password"
node -e "const m=require('mongoose'),b=require('bcryptjs'),U=require('./models/User');(async()=>{await m.connect(process.env.MONGO_URI);await U.create({email:'manual.staff@example.test',password:await b.hash(process.env.STAFF_PW,10),role:'staff'});await m.disconnect();console.log('staff created')})()"
```

- Use only fake emails such as `tester1@example.test`.
- Do not write passwords or participants' real names in any report.
- When finished, delete the test database: `mongosh "mongodb://127.0.0.1:27017/campus_it_help_desk_m3final_manual_test" --eval "db.dropDatabase()"`

---

## MAN-01 — Usability (NFR-01)

**Goal:** a student who has never seen the system can register, log in, and submit a ticket within 5 minutes without help.

**Steps:**
1. Find a participant who is not on our team and has not seen a demo. Record only a label such as "P1".
2. Open `http://localhost:5000/` and read this aloud: *"Please create a student account, log in, and submit a help request saying the campus Wi-Fi is not working. I can't help you during the task."*
3. Start a timer. Do not help. If they are stuck for more than 60 seconds, you may help, but record it.
4. Stop the timer when their ticket appears in "My Support Tickets".

**Expected result:** finished in 5:00 or less, with no help.

| Participant | Date | Total time (mm:ss) | Help needed? | Problems noticed | Result |
| ----------- | ---- | ------------------ | ------------ | ---------------- | ------ |
| P1 | | | | | Not Run |
| P2 | | | | | Not Run |

---

## MAN-02 — Compatibility on teammates' computers (NFR-05)

**Goal:** the system works on each team member's Windows computer.

**Steps:**
1. Record your Windows version (`winver`), `node --version`, and your browser version.
2. In `server/`, run `npm.cmd install`, then `npm.cmd test`. Record the result (expected: 27/27).
3. Start the server (see Setup) and, in your usual browser, do the following:
   - Register a student.
   - Log in and submit a ticket.
   - Log in as staff, set the ticket to In Progress, then close it with a note.
   - Log in as the student, check that the note is shown, and reopen the ticket.
   - Log out.

**Expected result:** every step works with no errors.

| Team member | Windows version | Node.js | Browser + version | `npm test` | Workflow works? | Result | Date |
| ----------- | --------------- | ------- | ----------------- | ---------- | --------------- | ------ | ---- |
| Test computer (already done) | Windows 11 Pro 10.0.26300 | v25.9.0 | Chrome 156 / Edge 157 | 27/27 | Yes (automated) | Pass | 2026-11-09 |
| | | | | | | Not Run | |
| | | | | | | Not Run | |
| | | | | | | Not Run | |

---

## MAN-03 — Visual review

**Goal:** the final Navy & Ice Blue design is clear and readable on every page.

**Steps:** open the home, register, login, student, and staff pages. Check each one at a normal window size and at a narrow window size.

**Expected result:**
- Navy header and light-blue background.
- Readable text.
- Status colors: Open is orange, In Progress is blue, Closed is green.
- Nothing overlaps.

| Tester | Date | Browser | Problems found | Result |
| ------ | ---- | ------- | -------------- | ------ |
| | | | | Not Run |
