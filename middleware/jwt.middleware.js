import { expressjwt } from "express-jwt";

const isAuthenticated = (req, res, next) => {
  const token = getTokenFromHeaders(req);

  if (!token) {
    return res.status(401).json({ message: "No authorization token was found" });
  }

  expressjwt({
    secret: process.env.TOKEN_SECRET,
    algorithms: ["HS256"],
    requestProperty: "payload",
  })(req, res, (err) => {
    if (err) {
      console.error("Error en JWT Middleware:", err);
      return res.status(401).json({ message: "Invalid token", error: err.message });
    }
    next();
  });
};

// Función para extraer el token
function getTokenFromHeaders(req) {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
}

export default isAuthenticated;
