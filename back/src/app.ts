import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "./user.ts";
import { BankAccount } from "./bank-account.ts";


export const app = express();

app.use(cors({ origin: "http://localhost:4200" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.get("/api/users", async (_req, res) => {
    const users = await User.find().lean();
    res.json(users);
});

app.get("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    const user = await User.findById(id).lean();
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    res.json(user);
});

app.post("/api/users", async (req, res) => {
    const user = await User.create(req.body ?? {});
    res.status(201).json(user);
});

app.patch("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    const user = await User.findByIdAndUpdate(id, req.body ?? {}, { new: true, runValidators: true });
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    res.json(user);
});

app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    const hasAccounts = await BankAccount.exists({ userId: id });
    if (hasAccounts) {
        res.status(409).json({ message: "User still has bank accounts" });
        return;
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    res.status(204).end();
});


// les comptes d'un seul utilisateur

app.get("/api/users/:id/accounts", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    const userExists = await User.exists({ _id: id });
    if (!userExists) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    const accounts = await BankAccount.find({ userId: id }).lean();
    res.json(accounts);
});


// Accounts API

app.get("/api/accounts", async (req, res) => {
    const { userId, type } = req.query;
    const filter: { userId?: string; type?: "checking" | "savings" } = {};
    if (userId !== undefined) {
        if (typeof userId !== "string" || !isValidObjectId(userId)) {
            res.status(400).json({ message: "Invalid userId" });
            return;
        }
        filter.userId = userId;
    }
    if (type !== undefined) {
        if (type !== "checking" && type !== "savings") {
            res.status(400).json({ message: "Invalid type" });
            return;
        }
        filter.type = type;
    }
    const accounts = await BankAccount.find(filter).lean();
    res.json(accounts);
});

app.get("/api/accounts/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    const account = await BankAccount.findById(id).lean();
    if (!account) {
        res.status(404).json({ message: "Account not found" });
        return;
    }
    res.json(account);
});

app.post("/api/accounts", async (req, res) => {
    const body = req.body ?? {};
    if (typeof body.userId !== "string" || !isValidObjectId(body.userId)) {
        res.status(400).json({ message: "Invalid userId" });
        return;
    }
    const userExists = await User.exists({ _id: body.userId });
    if (!userExists) {
        res.status(400).json({ message: "User does not exist" });
        return;
    }
    const account = await BankAccount.create(body);
    res.status(201).json(account);
});

app.patch("/api/accounts/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    const body = req.body ?? {};
    const editableFields = ["label", "type"];
    const forbidden = Object.keys(body).filter((key) => !editableFields.includes(key));
    if (forbidden.length > 0) {
        res.status(400).json({ message: `Field not editable: ${forbidden.join(", ")}` });
        return;
    }
    const account = await BankAccount.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!account) {
        res.status(404).json({ message: "Account not found" });
        return;
    }
    res.json(account);
});

app.delete("/api/accounts/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    const account = await BankAccount.findById(id);
    if (!account) {
        res.status(404).json({ message: "Account not found" });
        return;
    }
    if (account.balanceCents !== 0) {
        res.status(409).json({ message: "Account balance is not zero" });
        return;
    }
    await account.deleteOne();
    res.status(204).end();
});

app.use((_req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof SyntaxError) {
        res.status(400).json({ message: "Invalid JSON body" });
        return;
    }
    if (err instanceof mongoose.Error.ValidationError) {
        res.status(400).json({ message: err.message });
        return;
    }
    if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
        res.status(409).json({ message: "Value already used" });
        return;
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
});


