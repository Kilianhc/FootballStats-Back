import express from "express";
import Stat from "../models/Stat.model.js";
import isAuthenticated from "../middleware/jwt.middleware.js";

const router = express.Router();

//  Crear estadísticas (solo Analyst)
router.post("/stats", isAuthenticated, async (req, res, next) => {
  if (req.payload.role !== "Analyst") {
    return res.status(403).json({ message: "Access denied" });
  }

  const { player, game, performance } = req.body;

  try {
    const newStat = await Stat.create({ player, game, performance, createdBy: req.payload._id });
    res.status(201).json(newStat);
  } catch (err) {
    next(err);
  }
});

//  Obtener estadísticas (Coach solo ve su equipo, Analyst solo ve lo que creó)
router.get("/stats", isAuthenticated, async (req, res, next) => {
  try {
    const query = req.payload.role === "Analyst" 
      ? { createdBy: req.payload._id } 
      : { player: { $in: req.payload.team.players } };

    const stats = await Stat.find(query).populate("player");
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
