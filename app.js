// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
import dotenv from "dotenv";
dotenv.config()
console.log("TOKEN_SECRET:", process.env.TOKEN_SECRET);

// ℹ️ Connects to the database
import "./db/index.js";

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
import express from "express";

const app = express();
app.use(express.json());

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
import config from "./config/index.js"
config(app)

//  Start handling routes here
import indexRoutes from "./routes/index.routes.js";
app.use("/api", indexRoutes);

import authRoutes from "./routes/auth.routes.js";
app.use("/auth", authRoutes);

import userRoutes from "./routes/user.routes.js";
app.use("/api/users", userRoutes);

import teamRoutes from "./routes/team.routes.js";
app.use("/api/teams", teamRoutes);

import playerRoutes from "./routes/player.routes.js";
app.use("/api/players", playerRoutes)

import statRoutes from "./routes/stats.routes.js";
app.use("/api/stats", statRoutes)

import aiRoutes from "./routes/ai.routes.js"
app.use("/api/ai", aiRoutes)

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
import errorhandling from "./error-handling/index.js"
errorhandling(app)

export default app;
