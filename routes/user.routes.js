import express from "express";
import User from "../models/User.model.js";
import isAuthenticated from "../middleware/jwt.middleware.js";
import Team from "../models/Team.model.js";

const router = express.Router();

router.get("/profile", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id; // Extraer el ID del usuario autenticado

    const user = await User.findById(userId).select("-password"); // Excluir contraseña

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

/**  GET /api/users/:userId -> Obtener perfil de un usuario */
router.get("/:userId", isAuthenticated, async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Buscar usuario en la BD
    const user = await User.findById(userId).select("-password"); // Excluir password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

/**  PUT /api/users/:userId -> Modificar perfil (asignar equipo) */
// Ruta para modificar el perfil de usuario
router.put("/:userId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, team, role } = req.body; // Ahora "team" es el nombre del equipo enviado en el cuerpo

    let teamId = null;

    if (team) {
      const foundTeam = await Team.findOne({ name: team });
      if (!foundTeam) {
        return res.status(400).json({ message: "Team not found. Please provide a valid team name." });
      }
      teamId = foundTeam._id; // Guardamos el ID del equipo encontrado
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, team: teamId, role }, // Guardamos el ID en el campo `team`
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});



/**  DELETE /api/users/:userId -> Eliminar su cuenta */
router.delete("/:userId", isAuthenticated, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const loggedUserId = req.payload._id;

    // Solo el usuario puede eliminarse a sí mismo
    if (userId !== loggedUserId) {
      return res.status(403).json({ message: "You can only delete your own account" });
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
