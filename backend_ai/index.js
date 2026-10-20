require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 4000;
require("./conn");

app.use(express.json());

// Set origin to 'true' to dynamically accept the frontend URL 
// This eliminates any trailing slash or typo issues in Vercel Variables
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL
  })
);

const UserRoutes = require("./Routes/user");
const ResumeRoutes = require("./Routes/resume");

app.use("/api/user", UserRoutes);
app.use("/api/resume", ResumeRoutes);

app.listen(PORT, () => console.log("our backend is running ", PORT));

module.exports = app;

//hi