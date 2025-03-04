import express from "express";
import User from "../models/User.model.js";
import isAuthenticated from "../middleware/jwt.middleware.js";

const router = express.Router();

// ✅ Obtener perfil del usuario autenticado
router.get("/user", isAuthenticated, async (req, res, next) => {
  try {
    const user = await User.findById(req.payload._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

//  Obtener perfil de un usuario por ID (solo visible para sí mismo)
router.get("/user/:id", isAuthenticated, async (req, res, next) => {
  try {
    if (req.payload._id !== req.params.id) {
      return res.status(403).json({ message: "You can only view your own profile" });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

//  Actualizar datos del usuario autenticado
router.put("/user", isAuthenticated, async (req, res, next) => {
  const { name, email } = req.body;
  
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.payload._id,
      { name, email },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
});

//  Eliminar cuenta del usuario autenticado
router.delete("/user", isAuthenticated, async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.payload._id);
    res.status(204).send(); // No devuelve contenido, solo éxito
  } catch (err) {
    next(err);
  }
});

//  Obtener todos los usuarios (SOLO ANALYSTS PUEDEN VER A OTROS USUARIOS)
router.get("/", isAuthenticated, async (req, res, next) => {
  try {
    if (req.payload.role !== "Analyst") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
});

export default router;