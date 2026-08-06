import OpenAI from "openai";

const MODEL = "gpt-4o-mini";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to your .env.local file (see .env.example)."
    );
  }

  client = new OpenAI({ apiKey });
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
  const openai = getClient();

  const completion = await openai.chat.completions.create({
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
