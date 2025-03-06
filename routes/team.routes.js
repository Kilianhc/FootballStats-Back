import express from "express";
import isAuthenticated from "../middleware/jwt.middleware.js";
import Team from "../models/Team.model.js";
import User from "../models/User.model.js";

const router = express.Router();

//  (POST) Crear un equipo (Solo Analysts pueden hacerlo)
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.payload._id;

    // Verificar que el usuario es Analyst
    const user = await User.findById(userId);
    if (!user || user.role !== "Analyst") {
      return res.status(403).json({ message: "Only Analysts can create teams." });
    }

    // Verificar si el equipo ya existe
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({ message: "Team name already exists." });
    }

    // Crear equipo
    const newTeam = await Team.create({ name, createdBy: userId });

    res.status(201).json(newTeam);
  } catch (err) {
    next(err);
  }
});

//  (GET) Obtener todos los equipos (Solo Analysts ven los suyos)
router.get("/", async (req, res, next) => {
  try {
    const teams = await Team.find({}, "name"); // Solo devuelve el campo "name"
    res.status(200).json(teams);
  } catch (err) {
    next(err);
  }
});

//  (GET) Obtener detalles de un equipo por ID
router.get("/:teamId", isAuthenticated, async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }

    res.status(200).json(team);
  } catch (err) {
    next(err);
  }
});

//  (PUT) Modificar un equipo (Solo Analysts pueden modificar los suyos)
router.put("/:teamId", isAuthenticated, async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { name } = req.body;
    const userId = req.payload._id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }

    if (team.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "You can only edit teams you created." });
    }

    const updatedTeam = await Team.findByIdAndUpdate(teamId, { name }, { new: true });
    res.status(200).json(updatedTeam);
  } catch (err) {
    next(err);
  }
});

//  (DELETE) Eliminar un equipo (Solo Analysts pueden eliminar los suyos)
router.delete("/:teamId", isAuthenticated, async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.payload._id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }

    if (team.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete teams you created." });
    }

    await Team.findByIdAndDelete(teamId);
    res.status(200).json({ message: "Team deleted successfully." });
  } catch (err) {
    next(err);
  }
});

// (POST) Solicitar unirse a un equipo (Solo Coaches pueden hacerlo)
router.post("/:teamId/request", isAuthenticated, async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.payload._id;

    const user = await User.findById(userId);
    if (!user || user.role !== "Coach") {
      return res.status(403).json({ message: "Only Coaches can request to join a team." });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }

    if (team.joinRequests.includes(userId)) {
      return res.status(400).json({ message: "You have already requested to join this team." });
    }

    team.joinRequests.push(userId);
    await team.save();

    res.status(200).json({ message: "Request to join team sent." });
  } catch (err) {
    next(err);
  }
});

// (POST) Aceptar o rechazar solicitud de unión a un equipo (Solo Analysts pueden hacerlo)
router.post("/:teamId/respond-request", isAuthenticated, async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, accept } = req.body; // `accept` es un booleano
    const analystId = req.payload._id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }

    if (team.createdBy.toString() !== analystId) {
      return res.status(403).json({ message: "Only the team creator can accept/reject requests." });
    }

    if (!team.joinRequests.includes(userId)) {
      return res.status(400).json({ message: "No such request found." });
    }

    // Si se acepta, se asigna el equipo al usuario y se lo agrega al equipo
    if (accept) {
      await User.findByIdAndUpdate(userId, { team: teamId });
      team.coaches.push(userId);
    }

    // Se elimina la solicitud
    team.joinRequests = team.joinRequests.filter((id) => id.toString() !== userId);
    await team.save();

    res.status(200).json({ message: accept ? "User added to the team." : "Request rejected." });
  } catch (err) {
    next(err);
  }
});


export default router;
