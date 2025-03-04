// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
import "dotenv/config";

// ℹ️ Connects to the database
import "./db/index.js";

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
import express from "express";

const app = express();
app.use(express.json());

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
import config from "./config/index.js"

// 👇 Start handling routes here
import indexRoutes from "./routes/index.routes.js";
app.use("/api", indexRoutes);

import authRoutes from "./routes/auth.routes.js";
app.use("/auth", authRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
import errorhandling from "./error-handling/index.js"

export default app;
