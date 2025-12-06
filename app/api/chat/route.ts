import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 }
      );
    }

     const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let geminiRes: Response;
    try {
      geminiRes = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
          process.env.GEMINI_API_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: message }] }],
            generationConfig: {
              maxOutputTokens: 512,
              candidateCount: 1,
            },
          }),
          signal: controller.signal,
        }
      );
    } catch (err) {
      clearTimeout(timeout);
      const error = err as { name?: string };
      if (error?.name === "AbortError") {
        console.error("Gemini request aborted (timeout)");
        return NextResponse.json({ error: "Model request timed out" }, { status: 504 });
      }
      throw err;
    }
    clearTimeout(timeout);

    if (!geminiRes.ok) {
      console.error("Gemini responded with status", geminiRes.status);
      return NextResponse.json({ error: "Model error" }, { status: 502 });
    }

    const data = await geminiRes.json();

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        ?.join("") ?? "";

    return new Response(answer, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
