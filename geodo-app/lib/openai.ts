import OpenAI from "openai";

// Uses Groq's API, which is free (no credit card) and OpenAI-compatible, so
// none of the calling code needs to change. Get a key at
// https://console.groq.com/keys — just an email/Google sign-in, no billing
// setup and no cloud-project creation step.
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const MODEL = "llama-3.3-70b-versatile";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to your .env.local file (see .env.example)."
    );
  }

  client = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });
  return client;
}

/**
 * Calls the chat completions API in JSON mode and parses the result.
 * Throws a descriptive error if the model output cannot be parsed.
 */
export async function getJSONCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.8
): Promise<T> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("The AI returned an empty response. Please try again.");
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("The AI returned a response that could not be parsed as JSON.");
  }
}
