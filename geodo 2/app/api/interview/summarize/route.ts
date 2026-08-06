import { NextRequest, NextResponse } from "next/server";
import { getJSONCompletion } from "@/lib/openai";
import { BusinessProfile, InterviewAnswer } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a sharp marketing strategist who turns a short business interview into a
clean, structured profile that will be used to find relevant subreddits and write Reddit posts.

Respond with ONLY a JSON object with this exact shape:
{
  "name": string,               // the business/product name, inferred if not explicit
  "description": string,        // one or two sentence description of the business
  "sells": string,               // what they sell
  "targetCustomer": string,      // who the target customer is
  "uniqueValue": string,         // what makes them different
  "location": string,            // where they operate
  "goal": string,                // what they want the Reddit campaign to accomplish
  "summary": string              // a punchy 3-4 sentence summary of the whole business, written for a
                                  // marketer who needs to quickly understand who this is and how to pitch it
}

Be concrete and specific. Do not invent facts that contradict what the user said. If something is
genuinely unclear, make a reasonable, clearly-labeled inference rather than leaving it vague.`;

export async function POST(req: NextRequest) {
  try {
    const { answers } = (await req.json()) as { answers: InterviewAnswer[] };

    if (!answers || answers.length === 0) {
      return NextResponse.json({ error: "No interview answers were provided." }, { status: 400 });
    }

    const transcript = answers
      .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
      .join("\n\n");

    const profile = await getJSONCompletion<BusinessProfile>(
      SYSTEM_PROMPT,
      `Here is the interview transcript:\n\n${transcript}`,
      0.6
    );

    return NextResponse.json({ profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to summarize the interview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
