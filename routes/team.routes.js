import express from "express";
const router = express.Router();
import Team from "../models/Team.model.js";
import { isAuthenticated } from "../middleware/jwt.middleware.js"

router.get("/", async (req, res) => {
  const teams = await Team.find();
  res.json(teams);
});

router.post("/", isAuthenticated, async (req, res) => {
  const newTeam = await Team.create(req.body);
  res.json(newTeam);
});

router.delete("/:id", isAuthenticated, async (req, res) => {
  await Team.findByIdAndDelete(req.params.id);
  res.json({ message: "Equipo eliminado" });
});

module.exports = router;