import { Schema, model } from "mongoose";

// interface
export interface IUser {
    firstName: string;
    lastName: string;
    email: string;
}

//schéma: règles de validation

const userSchema = new Schema<IUser>({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        // format simple : xxx@yyy.zzz, sans espaces
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

}, { timestamps: true }); // adds createdAt and updatedAt

//modèle
export const User = model<IUser>("User", userSchema);