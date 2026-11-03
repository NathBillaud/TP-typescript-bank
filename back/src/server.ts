import mongoose from "mongoose";
import { app } from "./app.ts";
import { MONGODB_URI, PORT } from "./config.ts";

await mongoose.connect(MONGODB_URI);
console.log("MongoDB connected");

app.listen(PORT, () => {
    console.log(`API on http://localhost:${PORT}`);
});