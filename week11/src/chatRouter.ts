import { Router, Request, Response } from "express";
import { askAI } from "./lib/llm";

const router = Router();

// POST /chat
router.post("/", async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    const reply = await askAI(message.trim()); // เรียกฟังก์ชัน askAI เพื่อรับคำตอบจาก AI
    res.json({ success: true, reply });
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;