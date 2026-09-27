const express = require('express');
const resumeRoute = require('./route/resume.route')
const path = require("path");
const cors = require('cors');
const app = express();
app.use(cors());



app.use(express.json());

app.use("/output", express.static(path.join(__dirname, "output")));

app.use('/api',resumeRoute)

module.exports = app;