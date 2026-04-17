"use client";
import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "lmhq2026") {
      // Set cookie (365 days)
      document.cookie = `mkb_auth=authenticated;path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
      window.location.href = "/";
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={submit} style={{
        background: "#f8f9fa", border: "2px solid #08313a", borderRadius: 8,
        padding: 40, maxWidth: 380, width: "100%", textAlign: "center",
        boxShadow: "4px 4px 0 #08313a"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#e76f51" }} />
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: 2, textTransform: "uppercase" as const, color: "#08313a" }}>
            LOCAL MEDIA HQ
          </span>
        </div>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#e76f51", letterSpacing: 2, fontWeight: 700, marginBottom: 28, textTransform: "uppercase" as const }}>
          MEDIA KIT BUILDER
        </div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter password"
          autoFocus
          style={{
            background: "#fff", border: `1.5px solid ${error ? "#dc2626" : "#08313a"}`,
            borderRadius: 4, padding: "12px 14px", color: "#08313a", fontSize: 14,
            outline: "none", width: "100%", marginBottom: 14, textAlign: "center"
          }}
        />
        <button type="submit" style={{
          width: "100%", padding: "12px", borderRadius: 4,
          border: "2px solid #08313a", background: "#e76f51", color: "#fff",
          fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 0.5,
          boxShadow: "2px 2px 0 #08313a"
        }}>
          Enter
        </button>
        {error && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 12, fontWeight: 600 }}>Wrong password</div>}
      </form>
    </div>
  );
}
