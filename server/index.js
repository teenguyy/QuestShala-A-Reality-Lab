import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("./.env", import.meta.url)) });

const app = express();
const PORT = Number(process.env.PORT || 3001);
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser clients (for example, local health checks).
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by berrus API CORS policy."));
  },
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "berrus",
    configured: Boolean(process.env.GROQ_API_KEY),
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body ?? {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        error: "berrus AI is not configured. Add GROQ_API_KEY to server/.env and restart the server.",
      });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "You are berrus, QuestShala's friendly learning companion. " +
            "Help students understand concepts, solve doubts, explain topics simply, " +
            "and encourage curiosity. Be accurate, age-appropriate, supportive, and clear. " +
            "When solving a problem, explain the steps instead of only giving the answer.",
        },
        { role: "user", content: message.trim() },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(502).json({ error: "berrus received an empty response. Please try again." });
    }

    return res.json({ reply });
  } catch (error) {
    console.error("Groq request failed:", error?.message || error);
    return res.status(500).json({
      error: "berrus is temporarily unavailable. Check the server terminal for details.",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`berrus backend running on http://localhost:${PORT}`);
});
