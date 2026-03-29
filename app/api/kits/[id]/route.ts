import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET single kit
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase.from("media_kits").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PUT - update kit
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updates: any = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.form_data !== undefined) updates.form_data = body.form_data;
  if (body.generated_html !== undefined) updates.generated_html = body.generated_html;
  if (body.is_published !== undefined) updates.is_published = body.is_published;
  if (body.slug !== undefined) updates.slug = body.slug;

  const { data, error } = await supabase.from("media_kits").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE kit
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from("media_kits").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
