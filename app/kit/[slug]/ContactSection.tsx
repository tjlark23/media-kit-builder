"use client";
import { useState, useEffect, useCallback } from "react";

export default function ContactSection({ kitName, contactEmail }: { kitName: string; contactEmail: string }) {
  const [open, setOpen] = useState(false);
  const [sponsorName, setSponsorName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  // Listen for postMessage from the iframe to open the modal.
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "openContactModal" || e.data?.type === "scrollToContact") {
        setOpen(true);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Escape key closes the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || submitted) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sponsorName, company, email, message, kitName, contactEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.06)",
    color: "#fff",
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,.4)",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    display: "block",
    marginBottom: 6,
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8, 22, 40, 0.78)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <div
        style={{
          background: "linear-gradient(180deg, #1a2332 0%, #0a1628 100%)",
          border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 560,
          padding: "clamp(28px, 4vw, 44px)",
          position: "relative",
          boxShadow: "0 30px 80px rgba(0,0,0,.5)",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
        }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,.15)",
            background: "rgba(255,255,255,.06)",
            color: "#fff",
            fontSize: 20,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >&times;</button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            fontSize: 11,
            color: "#E8821A",
            textTransform: "uppercase",
            letterSpacing: 3,
            fontWeight: 700,
            marginBottom: 8,
          }}>Get in touch</div>
          <h2 id="contact-modal-title" style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(28px, 4vw, 38px)",
            color: "#fff",
            marginBottom: 8,
          }}>Interested in Advertising?</h2>
          <p style={{
            fontSize: 14,
            color: "rgba(255,255,255,.55)",
            lineHeight: 1.5,
          }}>Fill out the form and we will be in touch within 24 hours.</p>
        </div>

        {submitted ? (
          <div style={{
            background: "rgba(74,217,144,.08)",
            border: "1px solid rgba(74,217,144,.2)",
            borderRadius: 12,
            padding: "40px 28px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>&#10003;</div>
            <h3 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 26,
              color: "#4ad990",
              marginBottom: 6,
            }}>Message Sent</h3>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>
              We will be in touch within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Your Name *</label>
                <input
                  value={sponsorName}
                  onChange={e => setSponsorName(e.target.value)}
                  required
                  placeholder="Jane Smith"
                  style={inputStyle}
                  autoComplete="off"
                />
              </div>
              <div>
                <label style={labelStyle}>Company *</label>
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  required
                  placeholder="Acme Realty"
                  style={inputStyle}
                  autoComplete="off"
                />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="jane@acmerealty.com"
                style={inputStyle}
                autoComplete="off"
              />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us about your goals, budget, or timeline..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: 15,
                borderRadius: 8,
                border: "none",
                background: "#E8821A",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor: submitting ? "default" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 0.5,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
            {error && (
              <div style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 8,
                background: "rgba(255,60,60,.08)",
                border: "1px solid rgba(255,60,60,.2)",
                color: "#ff7070",
                fontSize: 13,
                textAlign: "center",
              }}>{error}</div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
