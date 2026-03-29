"use client";
import { useState, useEffect, useRef } from "react";

export default function ContactSection({ kitName, contactEmail }: { kitName: string; contactEmail: string }) {
  const [sponsorName, setSponsorName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Listen for postMessage from the iframe to scroll to contact form
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "scrollToContact") {
        sectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

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
    <div ref={sectionRef} id="contact-section" style={{
      background: "linear-gradient(180deg, #111 0%, #0a1628 100%)",
      padding: "80px 24px 100px",
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            fontSize: 12,
            color: "#E8821A",
            textTransform: "uppercase",
            letterSpacing: 3,
            fontWeight: 700,
            marginBottom: 8,
          }}>Get Started</div>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(32px, 5vw, 48px)",
            color: "#fff",
            marginBottom: 12,
          }}>Interested in Advertising?</h2>
          <p style={{
            fontSize: 15,
            color: "rgba(255,255,255,.45)",
            lineHeight: 1.6,
          }}>Fill out the form below and we will be in touch within 24 hours.</p>
        </div>

        {submitted ? (
          <div style={{
            background: "rgba(74,217,144,.08)",
            border: "1px solid rgba(74,217,144,.2)",
            borderRadius: 12,
            padding: "48px 32px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
            <h3 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 28,
              color: "#4ad990",
              marginBottom: 8,
            }}>Message Sent!</h3>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14 }}>
              We will be in touch within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: "rgba(255,255,255,.03)",
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 16,
            padding: "clamp(24px, 4vw, 40px)",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Your Name *</label>
                <input
                  value={sponsorName}
                  onChange={e => setSponsorName(e.target.value)}
                  required
                  placeholder="Jane Smith"
                  style={inputStyle}
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
                />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="jane@acmerealty.com"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us about your goals, budget, or timeline..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: 16,
                borderRadius: 8,
                border: "none",
                background: "#E8821A",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
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
