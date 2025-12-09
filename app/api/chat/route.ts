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

    let groqRes: Response;

    try {
      groqRes = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "user", content: message }
            ],
            stream: false
          }),
          signal: controller.signal,
        }
      );
    } catch (err) {
      clearTimeout(timeout);
      const error = err as { name?: string };
      if (error?.name === "AbortError") {
        console.error("GROQ request aborted (timeout)");
        return NextResponse.json(
          { error: "Model request timed out" },
          { status: 504 }
        );
      }
      throw err;
    }

    clearTimeout(timeout);

    if (!groqRes.ok) {
      const errorBody = await groqRes.text();
      console.error(
        "GROQ responded with status",
        groqRes.status,
        "Body:",
        errorBody
      );
      return NextResponse.json(
        { error: "Model error", status: groqRes.status, body: errorBody },
        { status: 502 }
      );
    }

    const data = await groqRes.json();

    const answer = data?.choices?.[0]?.message?.content ?? "";

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
