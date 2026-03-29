import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export default async function PublicKit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: kit } = await supabase
    .from("media_kits")
    .select("generated_html, is_published, name")
    .eq("slug", slug)
    .single();

  if (!kit || !kit.is_published || !kit.generated_html) {
    notFound();
  }

  return (
    <iframe
      srcDoc={kit.generated_html}
      style={{ width: "100%", height: "100vh", border: "none" }}
      title={kit.name}
    />
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: kit } = await supabase
    .from("media_kits")
    .select("name")
    .eq("slug", slug)
    .single();
  return {
    title: kit?.name ? `${kit.name} - Media Kit` : "Media Kit",
  };
}
