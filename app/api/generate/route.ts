import { NextRequest, NextResponse } from "next/server";

// Proxy to Supabase Edge Function
export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch("https://ydcjljkehjqqshftktth.supabase.co/functions/v1/generate-media-kit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: body.prompt }),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
