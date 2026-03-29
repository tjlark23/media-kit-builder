import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled";
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base);
  let attempt = 0;
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
    let query = supabase.from("media_kits").select("id").eq("slug", candidate).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query;
    if (!data || data.length === 0) return candidate;
    attempt++;
  }
}

// GET - list all kits
export async function GET() {
  const { data, error } = await supabase
    .from("media_kits")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST - create new kit
export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = body.name || "Untitled Kit";
  const slug = await uniqueSlug(name);
  const { data, error } = await supabase
    .from("media_kits")
    .insert({ name, slug, form_data: body.form_data || {}, generated_html: body.generated_html || null, is_published: false })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
