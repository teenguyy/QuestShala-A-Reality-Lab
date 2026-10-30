import assert from "node:assert/strict";
import { test } from "node:test";
import chat from "../netlify/functions/chat.mts";

test("chat uses the correct provider URL and handles provider errors safely", async () => {
  const originalFetch = globalThis.fetch;
  const originalNetlify = globalThis.Netlify;
  const request = () => new Request("https://example.test/api/chat", {
    method: "POST", body: JSON.stringify({ message: "Explain gravity", characterId: "Berrus" }),
  });
  try {
    for (const [variable, expectedUrl] of [
      ["GROQ_API_KEY", "https://api.groq.com/openai/v1/chat/completions"],
      ["XAI_API_KEY", "https://api.x.ai/v1/chat/completions"],
    ]) {
      globalThis.Netlify = { env: { get: name => name === variable ? "test-placeholder" : undefined } };
      globalThis.fetch = async (input) => {
        assert.equal(input instanceof Request ? input.url : String(input), expectedUrl);
        return Response.json({ choices: [{ message: { content: "Gravity attracts masses." } }] });
      };
      const response = await chat(request());
      assert.equal(response.status, 200);
      assert.equal((await response.json()).reply, "Gravity attracts masses.");
      for (const [upstream, expected] of [[401, 503], [403, 503], [429, 429], [500, 502]]) {
        globalThis.fetch = async () => Response.json({ error: { message: "private upstream detail" } }, { status: upstream });
        const failed = await chat(request());
        assert.equal(failed.status, expected);
        assert.ok(!(await failed.text()).includes("private upstream detail"));
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.Netlify = originalNetlify;
  }
});
