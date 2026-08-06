import OpenAI from "openai";

// Uses Google's Gemini API through its OpenAI-compatible endpoint. Gemini's
// free tier requires no credit card and no billing setup — get a key at
// https://aistudio.google.com/apikey. We keep using the `openai` SDK because
// Gemini implements the same request/response shape at this base URL, so
// none of the calling code needs to change.
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const MODEL = "gemini-2.5-flash";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your .env.local file (see .env.example)."
    );
  }

  client = new OpenAI({ apiKey, baseURL: GEMINI_BASE_URL });
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
