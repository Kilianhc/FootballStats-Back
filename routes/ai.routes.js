import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import isAuthenticated from "../middleware/jwt.middleware.js";
import User from "../models/User.model.js";
import Team from "../models/Team.model.js";
import Player from "../models/Player.model.js";
import Stats from "../models/Stats.model.js";
import { limiter, analyzeMessage } from "../middleware/ia.middleware.js";

dotenv.config();

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

// Ruta para obtener recomendaciones basadas en IA
router.post('/recommendations', isAuthenticated, limiter, async (req, res, next) => {
    try {
        const { prompt } = req.body; // El prompt enviado por el frontend
        const userId = req.payload._id; // ID del usuario autenticado (obtenido del token JWT)

        // Validar que el prompt esté presente
        if (!prompt) {
            return res.status(400).json({ error: 'El prompt es requerido.' });
        }

        // **Verificar si el mensaje es ofensivo**
        const moderationResult = await analyzeMessage(prompt);
        if (moderationResult.blocked) {
            return res.status(403).json({ error: moderationResult.message });
        }

        // **Si el mensaje es válido, continuar con Gemini**

        // Obtener el usuario autenticado
        const user = await User.findById(userId).populate("team");
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        // Verificar si el usuario tiene un equipo asignado
        if (!user.team) {
            return res.status(400).json({ error: 'El usuario no tiene un equipo asignado.' });
        }

        // Obtener el equipo del usuario y sus jugadores con estadísticas
        const team = await Team.findById(user.team._id).populate({
            path: "players",
            populate: { path: "stats" } // Populate para obtener las estadísticas de los jugadores
        });

        if (!team) {
            return res.status(404).json({ error: 'Equipo no encontrado.' });
        }

        // Crear un contexto con las estadísticas de los jugadores
        const playersData = team.players.map(player => ({
            name: player.name,
            position: player.position,
            stats: player.stats // Array de estadísticas del jugador
        }));

        // Construir el prompt contextualizado
        const contextualizedPrompt = `
  Eres un asistente de análisis deportivo. Tu tarea es responder preguntas sobre el equipo "${team.name}", sus jugadores y sus estadísticas.

  Pregunta del usuario: "${prompt}"

  Aquí tienes las estadísticas completas de los jugadores del equipo en formato JSON:
  ${JSON.stringify(playersData, null, 2)}

  Instrucciones:
  1. Analiza las estadísticas y responde la pregunta de manera precisa.
  2. Si la pregunta requiere comparaciones, utiliza los datos para justificar tu respuesta.
  3. Si la pregunta es sobre tácticas o recomendaciones, sugiere acciones basadas en los datos.
  4. Sé claro y conciso. Limita la respuesta a un máximo de 200 palabras.
  5. Formatea la respuesta con saltos de línea (\\n) para separar párrafos y listas.
  6. Usa guiones (-) para listas en lugar de asteriscos (*).
`;

        console.log("Enviando solicitud a Gemini con prompt:", contextualizedPrompt);

        // Llamar a la API de Gemini
        const response = await axios.post(
            `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: contextualizedPrompt }] }]
            }
        );

        console.log("Respuesta de Gemini:", response.data);

        // Devolver la respuesta de Gemini al frontend
        res.json(response.data);
    } catch (error) {
        console.error("Error al llamar a Gemini:", error.response?.data || error.message);
        res.status(500).json({ error: 'Error procesando la solicitud de IA.' });
    }
});

export default router;