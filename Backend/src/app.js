const express = require("express");
const resumeRoute = require("./route/resume.route");
const path = require("path");
const cors = require("cors");
const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    origin: "https://candidate-profile-generator-rouge.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(express.json());

app.get("/healthz", (req, res) => res.status(200).send("ok"));

app.use("/output", express.static(path.join(__dirname, "output")));

app.use("/api", resumeRoute);

module.exports = app;
