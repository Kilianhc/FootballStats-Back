import express from "express";
import Player from "../models/Player.model.js";
import Team from "../models/Team.model.js";
import Stat from "../models/Stats.model.js"
import isAuthenticated from "../middleware/jwt.middleware.js";
import mongoose from "mongoose";

const router = express.Router();

/**
 * Crear un nuevo jugador
 * Solo los analysts pueden hacerlo.
 */
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { name, age, position, team } = req.body;
    const userId = req.payload._id; // Extraemos el ID del usuario autenticado

    // Buscar el equipo por su nombre
    const foundTeam = await Team.findById(team);

    if (!foundTeam) {
      return res.status(404).json({ message: "El equipo no existe." });
    }

    // Crear las estadísticas iniciales del jugador
    const newStats = await Stat.create({ player: null, createdBy: userId });

    // Crear el jugador con el ID del equipo y del usuario que lo creó
    const newPlayer = await Player.create({
      name,
      age,
      position,
      team: foundTeam._id,
      stats: newStats._id, // Vinculamos las estadísticas al jugador
      createdBy: userId,
    });

    // Asignar el jugador a las estadísticas
    await Stat.findByIdAndUpdate(newStats._id, { player: newPlayer._id });

    //**Actualizar el equipo agregando el jugador a su lista de players**
    await Team.findByIdAndUpdate(
      foundTeam._id,
      { $push: { players: newPlayer._id } }, // Agregar el jugador al array
      { new: true }
    );

    res.status(201).json(newPlayer);
  } catch (error) {
    res.status(500).json({ message: "Error al crear el jugador.", error });
  }
});

/**
 * Obtener todos los jugadores del mismo equipo
 * Analysts y Coachs pueden ver los jugadores de su equipo.
 */
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.payload._id; // ID del usuario autenticado
    const userRole = req.payload.role; // Rol del usuario autenticado
    const userTeam = req.payload.team; // ID del equipo del usuario

    let players;

    if (userRole === "Analyst") {
      // Si es Analyst, solo ve los jugadores que ha creado y de su equipo
      players = await Player.find({ createdBy: userId, team: userTeam }).populate("team").populate("stats");
    } else if (userRole === "Coach") {
      // Si es Coach, solo ve los jugadores de su equipo
      players = await Player.find({ team: userTeam }).populate("team");
    } else {
      return res.status(403).json({ message: "No tienes permiso para ver jugadores." });
    }

    res.status(200).json(players);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los jugadores.", error });
  }
});


/**
 * Obtener un solo jugador por ID
 * Solo si pertenece al equipo del usuario autenticado.
 */
router.get("/:playerId", isAuthenticated, async (req, res) => {
  try {
    const userId = req.payload._id; // ID del usuario autenticado
    const userRole = req.payload.role; // Rol del usuario autenticado
    const userTeam = req.payload.team; // ID del equipo del usuario
    const playerId = req.params.playerId; // ID del jugador solicitado

    let player;

    if (userRole === "Analyst") {
      // Si es Analyst, solo ve los jugadores que ha creado y de su equipo
      player = await Player.findOne({ _id: playerId, createdBy: userId, team: userTeam }).populate("team").populate("stats");
    } else if (userRole === "Coach") {
      // Si es Coach, solo ve los jugadores de su equipo
      player = await Player.findOne({ _id: playerId, team: userTeam }).populate("team");
    } else {
      return res.status(403).json({ message: "No tienes permiso para ver jugadores." });
    }

    // Verifica si el jugador existe
    if (!player) {
      return res.status(404).json({ message: "Jugador no encontrado o no tienes permiso para verlo." });
    }

    res.status(200).json(player);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los jugadores.", error });
  }
});

/**
 * Modificar un jugador
 * Solo el analyst que creó el jugador puede modificarlo.
 */
router.put("/:playerId", isAuthenticated, async (req, res) => {
  try {
    const userId = req.payload._id; // ID del usuario autenticado
    const userRole = req.payload.role; // Rol del usuario autenticado
    const userTeam = req.payload.team; // ID del equipo del usuario
    const playerId = req.params.playerId; // ID del jugador solicitado
    const { name, age, position, stats, team } = req.body; // Datos a actualizar

    // Verifica que el playerId sea un ID válido
    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      return res.status(400).json({ message: "ID de jugador no válido." });
    }

    // Verifica que el usuario tenga el rol de Analyst
    if (userRole !== "Analyst") {
      return res.status(403).json({ message: "No tienes permiso para modificar jugadores." });
    }

    // Busca y actualiza el jugador
    const updatedPlayer = await Player.findOneAndUpdate(
      { _id: playerId, createdBy: userId, team: userTeam }, // Filtro
      { name, age, position, stats, team }, // Datos a actualizar
      { new: true } // Devuelve el documento actualizado
    );

    // Verifica si el jugador existe
    if (!updatedPlayer) {
      return res.status(404).json({ message: "Jugador no encontrado o no tienes permiso para modificarlo." });
    }

    res.status(200).json(updatedPlayer);
  } catch (error) {
    console.log("Error:", error); // Depuración
    res.status(500).json({ message: "Error al modificar el jugador.", error });
  }
});

/**
 * Eliminar un jugador
 * Solo el analyst que lo creó puede eliminarlo.
 */
router.delete("/:playerId", isAuthenticated, async (req, res) => {
  try {
    const { playerId } = req.params;
    const userId = req.payload._id; // Cambia req.user por req.payload
    const userRole = req.payload.role; // Cambia req.user por req.payload

    // Verifica que el playerId sea un ID válido
    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      return res.status(400).json({ message: "ID de jugador no válido." });
    }

    // Verifica que el usuario tenga el rol de Analyst
    if (userRole !== "Analyst") {
      return res.status(403).json({ message: "No tienes permiso para eliminar jugadores." });
    }

    // Busca el jugador en la base de datos
    const player = await Player.findById(playerId);
    if (!player || player.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "No puedes eliminar este jugador." });
    }

    // Elimina el jugador
    await Player.findByIdAndDelete(playerId);
    res.status(200).json({ message: "Jugador eliminado correctamente." });
  } catch (error) {
    console.log("Error:", error); // Depuración
    res.status(500).json({ message: "Error al eliminar el jugador.", error });
  }
});

// Ruta para obtener jugadores por equipo
router.get("/team/:teamId", isAuthenticated, async (req, res) => {
  try {
    const { teamId } = req.params; // Obtenemos el teamId de los parámetros de la URL
    const userRole = req.payload.role; // Rol del usuario autenticado
    const userTeam = req.payload.team; // ID del equipo del usuario

    let players;

    if (userRole === "Analyst") {
      // Si es Analyst, solo ve los jugadores que ha creado y de su equipo
      players = await Player.find({ createdBy: req.payload._id, team: teamId }).populate("team");
    } else if (userRole === "Coach") {
      // Si es Coach, solo ve los jugadores de su equipo
      players = await Player.find({ team: teamId }).populate("team");
    } else {
      return res.status(403).json({ message: "No tienes permiso para ver jugadores." });
    }

    res.status(200).json(players);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los jugadores.", error });
  }
});


export default router;
