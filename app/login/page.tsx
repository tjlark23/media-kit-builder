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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a1628" }}>
      <form onSubmit={submit} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: 40, maxWidth: 380, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: 22, letterSpacing: 2, marginBottom: 8 }}>
          <span style={{ color: "#4A90D9" }}>LOCAL MEDIA HQ</span>
        </div>
        <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: 16, color: "#E8821A", letterSpacing: 1, marginBottom: 28 }}>MEDIA KIT BUILDER</div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter password"
          autoFocus
          style={{ background: "rgba(255,255,255,.07)", border: `1px solid ${error ? "rgba(255,60,60,.4)" : "rgba(255,255,255,.1)"}`, borderRadius: 6, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", width: "100%", marginBottom: 14, textAlign: "center", fontFamily: "DM Sans, sans-serif" }}
        />
        <button type="submit" style={{ width: "100%", padding: "12px", borderRadius: 6, border: "none", background: "#E8821A", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "DM Sans, sans-serif", letterSpacing: 0.5 }}>
          Enter
        </button>
        {error && <div style={{ color: "#ff6060", fontSize: 13, marginTop: 12 }}>Wrong password</div>}
      </form>
    </div>
  );
}
