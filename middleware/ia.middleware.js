import rateLimit from 'express-rate-limit';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Limitar las peticiones a 50 por cada 30 minutos
export const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutos en milisegundos
  max: 25, // Limitar a 50 peticiones
  keyGenerator: (req) => req.payload._id, // Límite por usuario (utilizando el ID del usuario autenticado)
  message: "Has superado el límite de peticiones. Inténtalo nuevamente en 30 minutos.",
  headers: true, // Agregar encabezados de tasa a la respuesta
});

// Función para analizar si el mensaje del usuario es ofensivo o irrelevante
export const analyzeMessage = async (text) => {
  const PERSPECTIVE_API_KEY = process.env.PERSPECTIVE_API_KEY;
  const PERSPECTIVE_URL = "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze";
  
  try {
    const response = await axios.post(`${PERSPECTIVE_URL}?key=${PERSPECTIVE_API_KEY}`, {
      comment: { text },
      languages: ["es"], // Idioma español
      requestedAttributes: {
        TOXICITY: {},
        INSULT: {},
        THREAT: {},
        PROFANITY: {},
      },
    });

    // Extraer los valores de toxicidad
    const scores = response.data.attributeScores;
    const toxicity = scores.TOXICITY.summaryScore.value;
    const insult = scores.INSULT.summaryScore.value;
    const threat = scores.THREAT.summaryScore.value;
    const profanity = scores.PROFANITY.summaryScore.value;

    console.log("Resultados de Perspective API:", { toxicity, insult, threat, profanity });

    // Si alguna métrica supera 0.7 (70% de probabilidad de ser ofensivo), bloquear el mensaje
    if (toxicity > 0.7 || insult > 0.7 || threat > 0.7 || profanity > 0.7) {
      return { blocked: true, message: "Tu mensaje parece inapropiado. Intenta reformularlo." };
    }

    return { blocked: false, message: "Mensaje aceptado." };
  } catch (error) {
    console.error("Error en Perspective API:", error);
    return { blocked: false, message: "No se pudo analizar el mensaje. Procediendo de todos modos." };
  }
};
