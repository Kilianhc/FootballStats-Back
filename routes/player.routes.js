import express from "express";
const router = express.Router();
import Player from "../models/Player.model.js";
import { isAuthenticated } from "../middleware/jwt.middleware.js"

router.get("/", async (req, res) => {
  const players = await Player.find();
  res.json(players);
});

router.post("/", isAuthenticated, async (req, res) => {
  const newPlayer = await Player.create(req.body);
  res.json(newPlayer);
});

router.delete("/:id", isAuthenticated, async (req, res) => {
  await Player.findByIdAndDelete(req.params.id);
  res.json({ message: "Jugador eliminado" });
});

module.exports = router;