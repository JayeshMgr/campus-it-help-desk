const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const app = express();
const path = require("path");

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use(express.static(path.join(__dirname, "../public")));


app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

module.exports = app;
