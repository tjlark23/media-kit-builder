"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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

  const published = kits.filter(k => k.is_published);
  const drafts = kits.filter(k => !k.is_published);
  const generated = kits.filter(k => k.generated_html);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Topbar */}
      <div style={{
        background: "#f8f9fa", borderBottom: "2px solid #08313a", padding: "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#e76f51" }} />
          <span className="topbar-full" style={{ fontWeight: 900, fontSize: 16, letterSpacing: 2, textTransform: "uppercase" as const }}>
            LOCAL MEDIA HQ <span style={{ color: "#c7d5e0", margin: "0 4px" }}>/</span> <span style={{ color: "#e76f51" }}>KIT BUILDER</span>
          </span>
          <span className="topbar-short" style={{ fontWeight: 900, fontSize: 16, letterSpacing: 2 }}>
            LMHQ
          </span>
        </div>
        <a href="/builder" style={{
          padding: "8px 18px", borderRadius: 4, border: "2px solid #08313a",
          background: "#e76f51", color: "#fff", fontWeight: 700, fontSize: 13,
          cursor: "pointer", textDecoration: "none", letterSpacing: 0.5,
          boxShadow: "2px 2px 0 #08313a"
        }}>
          + NEW KIT
        </a>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "28px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: "inline-block", background: "#e76f51", color: "#fff",
              padding: "3px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700,
              letterSpacing: 1.5, textTransform: "uppercase" as const, marginBottom: 8,
              fontFamily: "ui-monospace, monospace"
            }}>
              DASHBOARD
            </div>
            <h1 style={{ fontWeight: 900, fontSize: 36, textTransform: "uppercase" as const, letterSpacing: 1, lineHeight: 1.1 }}>
              YOUR <span style={{ color: "#e76f51" }}>MEDIA KITS</span>
            </h1>
            <p style={{ color: "#5a7a8a", fontSize: 14, marginTop: 6, lineHeight: 1.6 }}>
              Create, edit, and share professional media kits for your newsletter brands.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid-stats" style={{ marginBottom: 24 }}>
            {[
              { label: "Total Kits", value: kits.length, color: "#08313a" },
              { label: "Published", value: published.length, color: "#16a34a" },
              { label: "Drafts", value: drafts.length, color: "#e9ae4a" },
              { label: "Generated", value: generated.length, color: "#e76f51" },
            ].map(s => (
              <div key={s.label} style={{
                background: "#f8f9fa", border: "2px solid #08313a", borderRadius: 6,
                padding: "16px 14px", boxShadow: "2px 2px 0 #08313a", textAlign: "center"
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "#5a7a8a", letterSpacing: 1.2,
                  textTransform: "uppercase" as const, fontFamily: "ui-monospace, monospace", marginTop: 2
                }}>{s.label}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{
                width: 36, height: 36, border: "3px solid #c7d5e0", borderTop: "3px solid #e76f51",
                borderRadius: "50%", margin: "0 auto 14px", animation: "spin 1s linear infinite"
              }} />
              <div style={{ color: "#5a7a8a", fontSize: 13 }}>Loading kits...</div>
            </div>
          ) : kits.length === 0 ? (
            <div style={{
              background: "#f8f9fa", border: "2px solid #08313a", borderRadius: 6,
              padding: 60, textAlign: "center", boxShadow: "2px 2px 0 #08313a"
            }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>&#9993;</div>
              <div style={{ fontSize: 16, color: "#08313a", fontWeight: 700, marginBottom: 8 }}>No media kits yet</div>
              <div style={{ fontSize: 13, color: "#5a7a8a", marginBottom: 24 }}>Create your first media kit to get started.</div>
              <a href="/builder" style={{
                display: "inline-block", padding: "12px 32px", borderRadius: 4,
                background: "#e76f51", color: "#fff", fontWeight: 700, fontSize: 14,
                textDecoration: "none", letterSpacing: 0.5, border: "2px solid #08313a",
                boxShadow: "2px 2px 0 #08313a"
              }}>
                CREATE YOUR FIRST KIT
              </a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {kits.map(kit => (
                <div key={kit.id} style={{
                  background: "#f8f9fa", border: "2px solid #08313a", borderRadius: 6,
                  borderLeft: `4px solid ${kit.is_published ? "#e76f51" : "#c7d5e0"}`,
                  padding: "16px 18px", boxShadow: "2px 2px 0 #08313a",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
                  flexWrap: "wrap" as const
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                    {/* Icon square */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 6, flexShrink: 0,
                      background: kit.is_published ? "#e76f51" : "#c7d5e0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "1.5px solid #08313a", fontSize: 18
                    }}>
                      {kit.generated_html ? "📄" : "📝"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#08313a" }}>{kit.name}</div>
                        <span style={{
                          padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                          background: kit.is_published ? "rgba(22,163,74,.1)" : "rgba(199,213,224,.2)",
                          color: kit.is_published ? "#16a34a" : "#5a7a8a",
                          border: `1px solid ${kit.is_published ? "rgba(22,163,74,.3)" : "#c7d5e0"}`
                        }}>
                          {kit.is_published ? "PUBLISHED" : "DRAFT"}
                        </span>
                        {kit.generated_html ? (
                          <span style={{
                            padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                            background: "rgba(233,174,74,.1)", color: "#b8860b", border: "1px solid rgba(233,174,74,.3)"
                          }}>
                            GENERATED
                          </span>
                        ) : null}
                      </div>
                      <div style={{ fontSize: 12, color: "#5a7a8a", fontFamily: "ui-monospace, monospace" }}>
                        /{kit.slug} &middot; Updated {new Date(kit.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="kit-actions">
                    {kit.is_published && kit.generated_html && (
                      <button onClick={() => copyLink(kit.slug)} style={{
                        padding: "7px 14px", borderRadius: 4, fontSize: 12, fontWeight: 700,
                        border: "1.5px solid #16a34a", background: "rgba(22,163,74,.08)",
                        color: "#16a34a", cursor: "pointer"
                      }}>
                        Copy Link
                      </button>
                    )}
                    <button onClick={() => togglePublish(kit)} style={{
                      padding: "7px 14px", borderRadius: 4, fontSize: 12, fontWeight: 700,
                      border: `1.5px solid ${kit.is_published ? "#e9ae4a" : "#e76f51"}`,
                      background: kit.is_published ? "rgba(233,174,74,.08)" : "rgba(231,111,81,.08)",
                      color: kit.is_published ? "#b8860b" : "#e76f51", cursor: "pointer"
                    }}>
                      {kit.is_published ? "Unpublish" : "Publish"}
                    </button>
                    <a href={`/builder/${kit.id}`} style={{
                      padding: "7px 14px", borderRadius: 4, fontSize: 12, fontWeight: 700,
                      border: "1.5px solid #08313a", background: "rgba(8,49,58,.05)",
                      color: "#08313a", cursor: "pointer", textDecoration: "none"
                    }}>
                      Edit
                    </a>
                    <button onClick={() => deleteKit(kit.id)} disabled={deleting === kit.id}
                      style={{
                        padding: "7px 14px", borderRadius: 4, fontSize: 12, fontWeight: 700,
                        border: "1.5px solid #dc2626", background: "rgba(220,38,38,.06)",
                        color: "#dc2626", cursor: "pointer", opacity: deleting === kit.id ? 0.5 : 1
                      }}>
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
