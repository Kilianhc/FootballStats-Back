import express from "express";
import Stat from "../models/Stats.model.js";
import isAuthenticated from "../middleware/jwt.middleware.js";
import Player from "../models/Player.model.js"

const router = express.Router();

//  Crear estadísticas (solo Analyst)
router.post("/", isAuthenticated, async (req, res, next) => {
  if (req.payload.role !== "Analyst") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const statsData = { 
      ...req.body, 
      createdBy: req.payload._id  // Asegurarse de asignar createdBy correctamente
    };

    const newStat = await Stat.create(statsData);

    res.status(201).json(newStat);
  } catch (err) {
    console.error("Error creating stats:", err);
    res.status(500).json({ message: "Error al crear las estadísticas.", error: err });
  }
});




//  Obtener estadísticas (Coach solo ve su equipo, Analyst solo ve lo que creó)
router.get("/", isAuthenticated, async (req, res, next) => {
  try {
    let query = {};
    
    if (req.payload.role === "Analyst") {
      query = { createdBy: req.payload._id };
    } else if (req.payload.role === "Coach" && req.payload.team) {
      query = { player: { $in: req.payload.team.players } };
    }

    console.log("Query being executed:", query); // Verifica qué consulta está ejecutando

    const stats = await Stat.find(query).populate("player");

    console.log("Stats found:", stats); // Verifica qué datos encuentra
    res.status(200).json(stats);
  } catch (err) {
    console.error("Error fetching stats:", err);
    next(err);
  }
});


router.get("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const stat = await Stat.findById(req.params.id).populate("player");

    if (!stat) {
      return res.status(404).json({ message: "Estadísticas no encontradas" });
    }

    // Verifica permisos
    if (
      req.payload.role === "Analyst" && stat.createdBy.toString() !== req.payload._id ||
      req.payload.role === "Coach" && stat.player.team.toString() !== req.payload.team
    ) {
      return res.status(403).json({ message: "No tienes permiso para ver estas estadísticas" });
    }

    res.status(200).json(stat);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Error al obtener las estadísticas.", error: err });
  }
});

/**
 *  PUT /api/stats/:id - Modificar estadísticas
 *  Solo el Analyst que las creó puede modificarlas
 */
router.put("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const stat = await Stat.findById(req.params.id);

    if (!stat) {
      return res.status(404).json({ message: "Estadísticas no encontradas" });
    }

    // Verifica permisos (solo el Analyst que las creó puede modificar)
    if (stat.createdBy.toString() !== req.payload._id) {
      return res.status(403).json({ message: "No tienes permiso para modificar estas estadísticas" });
    }

    // Actualizar estadísticas
    const updatedStat = await Stat.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.status(200).json(updatedStat);
  } catch (err) {
    console.error("Error updating stats:", err);
    res.status(500).json({ message: "Error al actualizar las estadísticas.", error: err });
  }
});

/**
 *  DELETE /api/stats/:id - Eliminar estadísticas
 *  Solo el Analyst que las creó puede eliminarlas
 */
router.delete("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const stat = await Stat.findById(req.params.id);

    if (!stat) {
      return res.status(404).json({ message: "Estadísticas no encontradas" });
    }

    // Verifica permisos (solo el Analyst que las creó puede eliminar)
    if (stat.createdBy.toString() !== req.payload._id) {
      return res.status(403).json({ message: "No tienes permiso para eliminar estas estadísticas" });
    }

    await Stat.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Estadísticas eliminadas correctamente" });
  } catch (err) {
    console.error("Error deleting stats:", err);
    res.status(500).json({ message: "Error al eliminar las estadísticas.", error: err });
  }
});

/**
 *   GET /api/stats/team/:teamId 
 *  Obtener estadísticas de todos los jugadores de un equipo
 */
router.get("/team/:teamId", isAuthenticated, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Buscar jugadores del equipo y obtener sus estadísticas
    const players = await Player.find({ team: teamId }).select("_id");
    const playerIds = players.map(player => player._id);

    const stats = await Stat.find({ player: { $in: playerIds } }).populate("player");

    res.status(200).json(stats);
  } catch (err) {
    console.error("Error fetching team stats:", err);
    res.status(500).json({ message: "Error al obtener las estadísticas del equipo.", error: err });
  }
});

/**
 *  GET /api/stats/player/:playerId 
 *  Obtener estadísticas de un jugador específico
 */
router.get("/player/:playerId", isAuthenticated, async (req, res) => {
  try {
    const { playerId } = req.params;
    const stats = await Stat.findOne({ player: playerId }).populate("player");

    if (!stats) {
      return res.status(404).json({ message: "No se encontraron estadísticas para este jugador." });
    }

    res.status(200).json(stats);
  } catch (err) {
    console.error("Error fetching player stats:", err);
    res.status(500).json({ message: "Error al obtener las estadísticas del jugador.", error: err });
  }
});

/**
 *  PUT /api/stats/player/:playerId 
 * Editar estadísticas de un jugador específico
 */
/**
 *  PUT /api/stats/player/:playerId 
 *  Actualizar estadísticas de un jugador específico sumando valores en lugar de sobrescribir
 */
router.put("/player/:playerId", isAuthenticated, async (req, res) => {
  try {
    const { playerId } = req.params;
    const newStats = req.body;

    // Buscar las estadísticas actuales del jugador
    let currentStats = await Stat.findOne({ player: playerId });

    if (!currentStats) {
      return res.status(404).json({ message: "Estadísticas no encontradas para este jugador." });
    }

    // Sumar las nuevas estadísticas a las existentes
    const updatedStats = await Stat.findOneAndUpdate(
      { player: playerId },
      {
        $inc: { // Operador MongoDB para incrementar valores numéricos
          matchs: newStats.matchs || 0,
          minutes: newStats.minutes || 0,
          goals: newStats.goals || 0,
          asists: newStats.asists || 0,
          saves: newStats.saves || 0,
          goalsConceded: newStats.goalsConceded || 0,
          cleanSheet: newStats.cleanSheet || 0,
          shootsOnGoalReceived: newStats.shootsOnGoalReceived || 0,
          goalShoots: newStats.goalShoots || 0,
          outShoots: newStats.outShoots || 0,
          triedDribblings: newStats.triedDribblings || 0,
          succesDribblings: newStats.succesDribblings || 0,
          triedTackles: newStats.triedTackles || 0,
          succesTackles: newStats.succesTackles || 0,
          triedPass: newStats.triedPass || 0,
          succesPass: newStats.succesPass || 0,
          turnoversBall: newStats.turnoversBall || 0,
          stealsBall: newStats.stealsBall || 0,
        }
      },
      { new: true }
    );

    // Sobreescribir estadísticas en `Player`*******
    await Player.findOneAndUpdate(
      { _id: playerId },
      { stats: updatedStats._id }
    );

    res.status(200).json(updatedStats);
  } catch (err) {
    console.error("Error updating player stats:", err);
    res.status(500).json({ message: "Error al actualizar las estadísticas del jugador.", error: err });
  }
});


/**
 *  DELETE /api/stats/player/:playerId 
 *  Eliminar estadísticas de un jugador específico
 */
router.delete("/player/:playerId", isAuthenticated, async (req, res) => {
  try {
    const { playerId } = req.params;
    const deletedStats = await Stat.findOneAndDelete({ player: playerId });

    if (!deletedStats) {
      return res.status(404).json({ message: "Estadísticas no encontradas para este jugador." });
    }

    res.status(200).json({ message: "Estadísticas eliminadas correctamente." });
  } catch (err) {
    console.error("Error deleting player stats:", err);
    res.status(500).json({ message: "Error al eliminar las estadísticas del jugador.", error: err });
  }
});

/**
 *  GET /api/stats/team/:teamId/position/:position 
 *  Obtener estadísticas de jugadores de un equipo según su posición
 */
router.get("/team/:teamId/position/:position", isAuthenticated, async (req, res) => {
  try {
    const { teamId, position } = req.params;

    // Buscar jugadores del equipo con la posición indicada
    const players = await Player.find({ team: teamId, position }).select("_id");
    const playerIds = players.map(player => player._id);

    // Obtener estadísticas de esos jugadores
    const stats = await Stat.find({ player: { $in: playerIds } }).populate("player");

    res.status(200).json(stats);
  } catch (err) {
    console.error("Error fetching stats by position:", err);
    res.status(500).json({ message: "Error al obtener las estadísticas de los jugadores por posición.", error: err });
  }
});

export default router;
