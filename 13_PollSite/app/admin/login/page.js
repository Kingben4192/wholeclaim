"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        // Distinguish an actual failed-credentials response (401) from
        // anything else (a 500, a network-adjacent error, etc.) -- the
        // API route already returns a deliberately generic
        // "invalid_credentials" for auth failures specifically, but this
        // page was previously showing "Incorrect password" for ANY
        // non-ok response, which is simply inaccurate for a genuine
        // server error and could mask a real outage as a typo.
        if (res.status === 401) {
          setError("Incorrect password.");
        } else {
          setError("Couldn't log in right now. Try again in a moment.");
        }
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", padding: "0 20px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, marginBottom: 20 }}>
        What Do People Think? — Owner Login
      </h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1.5px solid #E4E1D8",
            borderRadius: 8,
            fontSize: 15,
            marginBottom: 12,
          }}
        />
        {error && <p style={{ color: "#D9481E", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "11px 12px",
            background: "#14171C",
            color: "#FBFAF7",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {loading ? "Checking\u2026" : "Log in"}
        </button>
      </form>
    </div>
  );
}
