import { Schema, model, Types } from "mongoose";

export interface IBankAccount {
    userId: Types.ObjectId;
    iban: string;
    type: "checking" | "savings";
    label?: string;
    balanceCents: number;
}

const bankAccountSchema = new Schema<IBankAccount>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    iban: {
        type: String,
        required: true,
        unique: true,
        immutable: true,
        // 2 lettres, 2 chiffres, puis 10 à 30 caractères alpha
        match: /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/,
    },
    type: { type: String, required: true, enum: ["checking", "savings"] },
    label: { type: String, trim: true },
    balanceCents: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        immutable: true,
        validate: {
            validator: Number.isInteger,
            message: "balanceCents must be an integer",
        },
    },
}, { timestamps: true });

export const BankAccount = model<IBankAccount>("BankAccount", bankAccountSchema);