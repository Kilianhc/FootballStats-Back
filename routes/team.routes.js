import express from "express";
import isAuthenticated from "../middleware/jwt.middleware.js";
import Team from "../models/Team.model.js";
import User from "../models/User.model.js";
import mongoose from "mongoose";

const router = express.Router();

// (POST) Crear un equipo (Solo Analysts pueden hacerlo)
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

    // Asignar el equipo al usuario que lo creó
    await User.findByIdAndUpdate(userId, { team: newTeam._id });

    res.status(201).json(newTeam);
  } catch (err) {
    next(err);
  }
});

// (GET) Buscar equipos por nombre
router.get("/search", isAuthenticated, async (req, res, next) => {
  try {
    const { name } = req.query;

    let teams;
    if (!name || name.trim() === "") {
      // Si no se proporciona un nombre, devolver todos los equipos (o un límite)
      teams = await Team.find();
    } else {
      // Si se proporciona un nombre, buscar equipos que coincidan
      teams = await Team.find({ name: new RegExp(name, "i") });
    }

    console.log("Equipos encontrados:", teams); // 👀 Verifica los datos en el backend
    res.status(200).json(teams);
  } catch (err) {
    next(err);
  }
});

// (GET) Obtener detalles de un equipo por ID
router.get("/:teamId", isAuthenticated, async (req, res, next) => {
  try {
    const { teamId } = req.params;

    // Verifica si teamId es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }

    res.status(200).json(team);
  } catch (err) {
    next(err);
  }
});

// (PUT) Editar un equipo (Solo Analysts pueden hacerlo)
router.put("/:teamId", isAuthenticated, async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { name } = req.body;
    const userId = req.payload._id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }

    // Verificar que el usuario es el creador del equipo
    if (team.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "You can only edit teams you created." });
    }

    // Actualizar el equipo
    const updatedTeam = await Team.findByIdAndUpdate(teamId, { name }, { new: true });
    res.status(200).json(updatedTeam);
  } catch (err) {
    next(err);
  }
});

// (DELETE) Eliminar un equipo (Solo Analysts pueden hacerlo)
router.delete("/:teamId", isAuthenticated, async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.payload._id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }

    // Verificar que el usuario es el creador del equipo
    if (team.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete teams you created." });
    }

    // Eliminar el equipo
    await Team.findByIdAndDelete(teamId);
    res.status(200).json({ message: "Team deleted successfully." });
  } catch (err) {
    next(err);
  }
});

// (GET) Obtener solicitudes de unión a un equipo (Solo Analysts pueden hacerlo)
router.get("/:teamId/requests", isAuthenticated, async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.payload._id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }

    // Verificar que el usuario es el creador del equipo
    if (team.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Only the team creator can view requests." });
    }

    // Obtener detalles de los usuarios que han solicitado unirse
    const requests = await User.find({ _id: { $in: team.joinRequests } }).select("name email");
    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
});

// (POST) Responder a una solicitud de unión (Solo Analysts pueden hacerlo)
router.post("/:requestId/respond-request", isAuthenticated, async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { accept } = req.body; // `accept` es un booleano
    const analystId = req.payload._id;

    const team = await Team.findOne({ joinRequests: requestId });
    if (!team) {
      return res.status(404).json({ message: "Request not found." });
    }

    // Verificar que el usuario es el creador del equipo
    if (team.createdBy.toString() !== analystId) {
      return res.status(403).json({ message: "Only the team creator can accept/reject requests." });
    }

    // Si se acepta, se asigna el equipo al usuario y se lo agrega al equipo
    if (accept) {
      await User.findByIdAndUpdate(requestId, { team: team._id });
      team.coaches.push(requestId);
    }

    // Se elimina la solicitud
    team.joinRequests = team.joinRequests.filter((id) => id.toString() !== requestId);
    await team.save();

    res.status(200).json({ message: accept ? "User added to the team." : "Request rejected." });
  } catch (err) {
    next(err);
  }
});

export default router;