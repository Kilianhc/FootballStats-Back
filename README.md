﻿# FootballStats - Backend

Este es el **backend** de la aplicación **FootballStats**, una API REST construida con **Node.js**, **ExpressJS**, y **MongoDB**. Esta API gestiona datos sobre equipos, jugadores y estadísticas de fútbol. Además, incorpora inteligencia artificial para generar recomendaciones tácticas y moderar mensajes.

La aplicación frontend es una **Single Page Application (SPA)** desarrollada en **React** y se comunica con este backend a través de las rutas REST definidas.

## 🚀 Características

✅ **API RESTful** construida con ExpressJS y MongoDB.
  
✅ **CRUD completo** para modelos de `Usuario`, `Jugador`, `Equipo` y `Estadísticas`.
  
✅ **Autenticación con JWT** y control de acceso por roles (analistas y entrenadores).
  
✅ **Rate Limiting** con Express Rate Limit: máximo **20 peticiones cada 30 minutos por usuario**.
  
✅ **Integración de IA** con:
   - **Google Perspective API** para moderación de mensajes.  
   - **Google Gemini AI** para la generación de recomendaciones tácticas.
  
✅ **Manejo de errores centralizado** y validación en el backend.  
✅ **Despliegue en línea** para permitir acceso público a la aplicación.

## 📌 Instalación y Configuración

### **1️⃣ Requisitos previos**
- **Node.js** instalado.
- **MongoDB** en funcionamiento (local o en la nube).
- **Claves API** para **Perspective AI** y **Gemini AI**.

### **2️⃣ Instalación**
1. Clonar el repositorio:
   ```sh
   git clone https://github.com/tu-usuario/FootballStats-Back.git
   cd FootballStats-Back
2. Instalar dependencias:
   ```sh
   npm install
3. Crear un archivo .env en la raíz del proyecto y configurar las siguientes variables de entorno:
   ```sh
   MONGO_URI=tu_url_de_mongodb
   JWT_SECRET=tu_secreto
   PERSPECTIVE_API_KEY=tu_api_key
   GEMINI_API_KEY=tu_api_key

### **3️⃣ Ejecución**
1. Iniciar el servidor en modo desarrollo:
   ```sh
   npm run dev
2. Iniciar el servidor en producción:
   ```sh
   npm start

## 🔒 Seguridad y Limitaciones

- **Autenticación con JWT:** Todas las rutas protegidas requieren un token válido para acceder.
- **Rate limiting con Express Rate Limit:** Máximo 20 peticiones cada 30 minutos por usuario.
- **Cifrado de contraseñas** con bcrypt.js para proteger la información de los usuarios.

## 🛠️ Tecnologías utilizadas

- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Autenticación:** JSON Web Token (JWT), bcrypt.js
- **IA:** Google Gemini AI, Google Perspective API
- **Otros:** Express Rate Limit, CORS, Axios, dotenv

## 📜 Licencia

Este proyecto está bajo la licencia MIT

