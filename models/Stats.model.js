import mongoose from "mongoose";

const statsSchema = new mongoose.Schema({

  //Stats generales
  player: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
  matchs: {type: Number, default: 0},
  minutes: {type: Number, default: 0},

  // Stats generales (excepto porteros)
  goals: { type: Number, default: 0 },
  asists: { type: Number, default: 0 },
 
  // Stats específicas para porteros
  saves: { type: Number, default: 0 },
  goalsConceded: { type: Number, default: 0 },
  cleanSheet: { type: Number, default: 0 },
  shootsOnGoalReceived: { type: Number, default: 0 },

  // Stats específicas para delanteros
  goalShoots: { type: Number, default: 0 },
  outShoots: { type: Number, default: 0 },
  triedDribblings: { type: Number, default: 0 },
  succesDribblings: { type: Number, default: 0 },

  // Stats específicas para defensas y centrocampistas
  triedTackles: { type: Number, default: 0 },
  succesTackles: { type: Number, default: 0 },
  triedPass: { type: Number, default: 0 },
  succesPass: { type: Number, default: 0 },
  turnoversBall: { type: Number, default: 0 },
  stealsBall: { type: Number, default: 0 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

export default mongoose.model("Stats", statsSchema);