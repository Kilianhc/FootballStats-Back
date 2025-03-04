import { Schema, model } from "mongoose";
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const userSchema = new mongoose.Schema(
  {
    name: {type: String, required: [true, "Name is required."]},
    email: {type: String, required: [true, "Email is required."], unique: true, lowercase: true, trim: true},
    password: {type: String, required: [true, "Password is required."]},
    role: {type:String, enum: ['Coach', 'Analyst'], required: true},
    team: {type: mongoose.Schema.Types.ObjectId, ref: 'Team'} 
  },{ timestamps: true })

  /* userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  }); */

const User = mongoose.model("User", userSchema);

export default User
