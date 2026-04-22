"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      isRegistering: isRegistering ? "true" : "false",
    });

    if (res?.error) {
      setError(isRegistering
        ? "Registration failed. Try again or ask an admin."
        : "Incorrect email or password.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", overflow: "hidden" }}>

      {/* Full-screen background */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage: "url('/prayer_sunset_bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        zIndex: 0,
      }} />

      {/* Gradient overlay */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.92) 100%)",
        zIndex: 1,
      }} />

      {/* Login card */}
      <div style={{
        position: "relative",
        zIndex: 2,
        maxWidth: "420px",
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "24px 24px 56px",
      }}>
        <div>
          <h1 className="playfair" style={{
            fontSize: "3rem",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.05,
            marginBottom: "8px",
            textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          }}>
            Daily<br />Prayer
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", marginBottom: "36px" }}>
            {isRegistering ? "Create your account to begin." : "Sign in to open your heart."}
          </p>

          {error && (
            <div style={{
              color: "#ff6b6b",
              fontSize: "0.88rem",
              marginBottom: "16px",
              padding: "10px 14px",
              background: "rgba(255,107,107,0.1)",
              borderRadius: "8px",
              border: "1px solid rgba(255,107,107,0.25)",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email Address"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }}
            />
            <input
              type="password"
              placeholder="Password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }}
            />
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "8px" }}>
              {loading ? "Please wait..." : (isRegistering ? "Create Account" : "Sign In")}
            </button>
          </form>

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontFamily: "inherit",
              }}
            >
              {isRegistering ? "Already have an account? Sign in" : "Need an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
