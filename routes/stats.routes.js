import express from "express";
const router = express.Router();
import Stats from "../models/Stats.model.js";
import { isAuthenticated } from "../middleware/jwt.middleware.js"

router.get("/", async (req, res) => {
  const stats = await Stats.find();
  res.json(stats);
});

router.post("/", isAuthenticated, async (req, res) => {
  const newStats = await Stats.create(req.body);
  res.json(newStats);
});

router.delete("/:id", isAuthenticated, async (req, res) => {
  await Stats.findByIdAndDelete(req.params.id);
  res.json({ message: "Estadísticas eliminadas" });
});

module.exports = router;