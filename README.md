# Campus IT Help Desk – Run Locally

## 1. Setup (first time only)

```powershell
git clone https://github.com/JayeshMgr/campus-it-help-desk.git
cd campus-it-help-desk\server
npm install
notepad .env
```

Put this in `server\.env` (get the real values from the project owner):

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/campus_it_help_desk?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
PORT=5000
```

You also need a MongoDB Atlas database user, and your IP address added to the cluster's **Network Access** list. Never commit `.env`.

## 2. Run the project

From the `campus-it-help-desk` folder (skip `cd server` if you're already in it):
```powershell
cd server
npm run dev
```

If PowerShell blocks `npm.ps1`, use `npm.cmd run dev` instead.

Wait for `MongoDB connected successfully`, then open **http://localhost:5000/login.html**.
No separate frontend server is needed (don't use Live Server).

## 3. Common errors

- **Unable to connect to the server:** make sure the server terminal is still running, and use `http://localhost:5000`.
- **MongoDB connection failed:** check the credentials and the `campus_it_help_desk` database name in `server\.env`, and your Atlas IP access.
- **Login fails:** check that `JWT_SECRET` is set and `MONGO_URI` uses `campus_it_help_desk`. Restart the server after editing `.env`.

## 4. Next time

From the `campus-it-help-desk` folder:
```powershell
git pull origin main
cd server
npm run dev
```

If the pull changed `server/package.json`, run `npm install` before `npm run dev`.


## 5. Create a Staff Account

Student accounts can be registered through the website. Staff accounts must be created separately.

From the `server` folder, run:

```powershell
npm run create-staff
```

Enter the staff email and password, then confirm the account creation.

Once created, open `http://localhost:5000/login.html` and log in using the new staff credentials.

**Note:** A working MongoDB connection configured in `server/.env` is required.