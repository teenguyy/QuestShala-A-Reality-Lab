import type { Config } from "@netlify/functions";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { getLearningCharacter } from "../../src/characters.ts";

export default async function chat(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: "Use POST to send a message." }, { status: 405, headers: { Allow: "POST" } });
  }

  let body: { message?: unknown; characterId?: unknown };
  try {
    body = await request.json();
    if (!body || typeof body !== "object") throw new Error("Invalid body");
  } catch {
    return Response.json({ error: "Send a valid JSON message." }, { status: 400 });
  }
  if (typeof body.message !== "string" || !body.message.trim()) {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }
  if (body.message.length > 8000) {
    return Response.json({ error: "Please keep your message under 8,000 characters." }, { status: 400 });
  }

  const groqKey = Netlify.env.get("GROQ_API_KEY")?.trim();
  const xaiKey = Netlify.env.get("XAI_API_KEY")?.trim();
  if (!groqKey && !xaiKey) {
    return Response.json({ error: "The AI service is not configured yet. Please try again later." }, { status: 503 });
  }

  const character = getLearningCharacter(typeof body.characterId === "string" ? body.characterId : undefined);
  try {
    // Groq's SDK adds /openai/v1 itself; use its default base URL.
    const parameters = {
      model: groqKey ? "openai/gpt-oss-120b" : "grok-4",
      messages: [
        { role: "system" as const, content: `${character.systemPrompt} You are a QuestShala learning companion. Explain problem-solving steps clearly and encourage curiosity.` },
        { role: "user" as const, content: body.message.trim() },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    };
    const completion = groqKey
      ? await new Groq({ apiKey: groqKey, timeout: 25000, maxRetries: 0 }).chat.completions.create(parameters)
      : await new OpenAI({ apiKey: xaiKey, baseURL: "https://api.x.ai/v1", timeout: 25000, maxRetries: 0 }).chat.completions.create(parameters);
    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) return Response.json({ error: "The AI returned an empty answer. Please try again." }, { status: 502 });
    return Response.json({ reply }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof Groq.APIError || error instanceof OpenAI.APIError ? error.status : undefined;
    if (status === 401 || status === 403) {
      return Response.json({ error: "The AI provider rejected the configured key or its permissions. The site owner needs to check the server-side API key." }, { status: 503 });
    }
    if (status === 429) {
      return Response.json({ error: "The AI is busy or its usage limit has been reached. Please try again shortly." }, { status: 429 });
    }
    return Response.json({ error: "The AI service is temporarily unavailable. Please try again shortly." }, { status: 502 });
  }
}
export const config: Config = { path: "/api/chat" };
