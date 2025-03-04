import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: {type: Number, required: true},
  position: { type: String, enum: ["Delantero", "Centrocampista", "Defensa", "Portero"], required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  stats: { type: mongoose.Schema.Types.ObjectId, ref: "Stats" },
});

module.exports = mongoose.model("Player", playerSchema);