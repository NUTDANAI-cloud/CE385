import express from "express";
import cors from "cors";
import mcpRouter from "./mcpRouter";
import chatRouter from "./chatRouter";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serve frontend

app.use("/mcp", mcpRouter);
app.use("/chat", chatRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));