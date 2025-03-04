import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
  analysts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  coaches: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

export default mongoose.model("Team", teamSchema);