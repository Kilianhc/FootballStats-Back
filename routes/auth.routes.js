import express from "express";
const router = express.Router();

// ℹ️ Handles password encryption
import bcrypt from "bcrypt";

// ℹ️ Handles password encryption
import jwt from "jsonwebtoken";

// Require the User model in order to interact with the database
import User from "../models/User.model.js";

import Team from "../models/Team.model.js"

// Require necessary (isAuthenticated) middleware in order to control access to specific routes
import isAuthenticated from "../middleware/jwt.middleware.js";

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

// POST /auth/signup  - Creates a new user in the database
router.post("/signup", async (req, res, next) => {
  const { email, password, name, role } = req.body;

  // Check if email or password or name are provided as empty strings
  if (!email || !password || !name || !role) {
    res.status(400).json({ message: "Provide email, password, name and role" });
    return;
  }

  if (!["Coach", "Analyst"].includes(role)) {
    return res.status(400).json({ message: "Invalid role. Allowed roles: analista, coach" });
  }

  /* // Validar el campo 'team' según el rol
  if ((role === "Coach" || role === "Analyst") && !teamName) {
    return res.status(400).json({ message: "Team is required for coach role" });
  } */

  // This regular expression check that the email is of a valid format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Provide a valid email address." });
    return;
  }

  // This regular expression checks password for special characters and minimum length
  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({
      message:
        "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.",
    });
    return;
  }

  // Check the users collection if a user with the same email already exists
  try {
    // Verificar si el usuario ya existe
    const foundUser = await User.findOne({ email });
    if (foundUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Hash de la contraseña
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);
   
    // Crear el nuevo usuario
    const createdUser = await User.create({
      email,
      password: hashedPassword,
      name,
      team: null, // Asignar el ID del equipo (o null si es Analista)
      role
    });

    // Devolver el usuario creado (sin la contraseña)
    const { email: userEmail, name: userName, _id, role: userRole} = createdUser;
    const user = { email: userEmail, name: userName, _id, role: userRole};
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

// POST  /auth/login - Verifies email and password and returns a JWT
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email or password are provided as empty string
  if (email === "" || password === "") {
    res.status(400).json({ message: "Provide email and password." });
    return;
  }

  try {
    // Buscar el usuario en la base de datos
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return res.status(401).json({ message: "User not found." });
    }
    
    // Comparar la contraseña
    const passwordCorrect = bcrypt.compareSync(password, foundUser.password);
    console.log("¿Contraseña correcta?", passwordCorrect); // Debería ser true
    if (!passwordCorrect) {
      return res.status(401).json({ message: "Unable to authenticate the user" });
    }

    // Crear el token JWT
    const { _id, email: userEmail, name, role, team } = foundUser;
    const payload = { _id, email: userEmail, name, role, team };

    console.log("Payload:", payload); // Depuración

    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "6h",
    });
    console.log("Token generado:", authToken); // Depuración

    // Devolver el token
    res.status(200).json({ authToken });
  } catch (err) {
    console.error("Error en /auth/login:", err)
    next(err);
  }
});

// GET  /auth/verify  -  Used to verify JWT stored on the client
router.get("/verify", isAuthenticated, (req, res, next) => {
  // If JWT token is valid the payload gets decoded by the
  // isAuthenticated middleware and is made available on `req.payload`
  // console.log(`req.payload`, req.payload);

  // Send back the token payload object containing the user data
  res.status(200).json(req.payload);
});

export default router
