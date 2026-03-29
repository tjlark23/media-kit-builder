"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const S = {
  input: { background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", width: "100%" },
  card: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: 20 },
  label: { fontSize: 11, fontWeight: 700, color: "#4a6080", letterSpacing: 1.2, textTransform: "uppercase" as const, display: "block", marginBottom: 5 },
};

type Kit = {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  generated_html: string | null;
};

export default function Dashboard() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("media_kits")
      .select("id, name, slug, is_published, created_at, updated_at, generated_html")
      .order("updated_at", { ascending: false });
    setKits(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteKit = async (id: string) => {
    if (!confirm("Delete this media kit?")) return;
    setDeleting(id);
    await supabase.from("media_kits").delete().eq("id", id);
    setKits(k => k.filter(x => x.id !== id));
    setDeleting(null);
  };

  const togglePublish = async (kit: Kit) => {
    const newVal = !kit.is_published;
    await supabase.from("media_kits").update({ is_published: newVal }).eq("id", kit.id);
    setKits(k => k.map(x => x.id === kit.id ? { ...x, is_published: newVal } : x));
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/kit/${slug}`;
    navigator.clipboard.writeText(url);
    alert("Link copied!");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#060e1a", borderBottom: "1px solid rgba(255,255,255,.07)", padding: "0 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, flexShrink: 0 }}>
        <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: 19, letterSpacing: 2 }}>
          <span style={{ color: "#4A90D9" }}>LOCAL MEDIA HQ</span>
          <span style={{ color: "#2a3a50", margin: "0 8px" }}>|</span>
          <span style={{ color: "#E8821A" }}>MEDIA KIT BUILDER</span>
        </div>
        <a href="/builder" style={{ padding: "8px 20px", borderRadius: 5, border: "none", background: "#E8821A",
          color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", textDecoration: "none", letterSpacing: 0.5 }}>
          + NEW KIT
        </a>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "36px 28px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: 42, marginBottom: 6 }}>
            YOUR <span style={{ color: "#4A90D9" }}>MEDIA KITS</span>
          </h1>
          <p style={{ color: "#3a5070", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
            Create, edit, and share professional media kits for your newsletter brands.
          </p>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,.07)", borderTop: "3px solid #4A90D9",
                borderRadius: "50%", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
              <div style={{ color: "#3a5070", fontSize: 13 }}>Loading kits...</div>
            </div>
          ) : kits.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>&#9993;</div>
              <div style={{ fontSize: 16, color: "#6a8090", marginBottom: 8 }}>No media kits yet</div>
              <div style={{ fontSize: 13, color: "#3a5070", marginBottom: 24 }}>Create your first media kit to get started.</div>
              <a href="/builder" style={{ display: "inline-block", padding: "12px 32px", borderRadius: 6, background: "#E8821A",
                color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none", letterSpacing: 0.5 }}>
                CREATE YOUR FIRST KIT
              </a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {kits.map(kit => (
                <div key={kit.id} style={{ ...S.card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{kit.name}</div>
                      <span style={{ padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                        background: kit.is_published ? "rgba(74,217,144,.1)" : "rgba(255,255,255,.05)",
                        color: kit.is_published ? "#4ad990" : "#3a5070",
                        border: `1px solid ${kit.is_published ? "rgba(74,217,144,.2)" : "rgba(255,255,255,.07)"}` }}>
                        {kit.is_published ? "PUBLISHED" : "DRAFT"}
                      </span>
                      {kit.generated_html ? (
                        <span style={{ padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                          background: "rgba(74,144,217,.1)", color: "#4A90D9", border: "1px solid rgba(74,144,217,.2)" }}>
                          GENERATED
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 12, color: "#3a5070" }}>
                      /{kit.slug} - Updated {new Date(kit.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {kit.is_published && kit.generated_html && (
                      <button onClick={() => copyLink(kit.slug)} style={{ padding: "7px 14px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                        border: "1px solid rgba(74,217,144,.25)", background: "rgba(74,217,144,.08)", color: "#4ad990", cursor: "pointer" }}>
                        Copy Link
                      </button>
                    )}
                    <button onClick={() => togglePublish(kit)} style={{ padding: "7px 14px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${kit.is_published ? "rgba(255,170,70,.25)" : "rgba(74,144,217,.25)"}`,
                      background: kit.is_published ? "rgba(255,170,70,.08)" : "rgba(74,144,217,.08)",
                      color: kit.is_published ? "#ffaa46" : "#4A90D9", cursor: "pointer" }}>
                      {kit.is_published ? "Unpublish" : "Publish"}
                    </button>
                    <a href={`/builder/${kit.id}`} style={{ padding: "7px 14px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                      border: "1px solid rgba(74,144,217,.25)", background: "rgba(74,144,217,.08)", color: "#4A90D9",
                      cursor: "pointer", textDecoration: "none" }}>
                      Edit
                    </a>
                    <button onClick={() => deleteKit(kit.id)} disabled={deleting === kit.id}
                      style={{ padding: "7px 14px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                        border: "1px solid rgba(255,60,60,.2)", background: "rgba(255,60,60,.06)", color: "#ff6060",
                        cursor: "pointer", opacity: deleting === kit.id ? 0.5 : 1 }}>
                      {deleting === kit.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
