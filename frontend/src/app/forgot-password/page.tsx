"use client";

import { useState, FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setDevLink("");
    setLoading(true);

    try {
      const res = await apiFetch<{ message: string; dev_reset_link?: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      });
      setMessage(res.message);
      if (res.dev_reset_link) {
        setDevLink(res.dev_reset_link);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-md p-8 animate-slide-up shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reset Password</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Enter your email to receive a reset link.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@school.com"
              className="input-field shadow-sm"
            />
          </div>

          {error && (
            <div className="text-sm text-[var(--error)] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 animate-fade-in">
              {error}
            </div>
          )}

          {message && (
            <div className="text-sm text-[var(--success)] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] rounded-lg p-3 animate-fade-in">
              {message}
            </div>
          )}

          {devLink && (
            <div className="text-sm text-[var(--accent)] bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.2)] rounded-lg p-3 animate-fade-in mt-2 break-all">
              <strong>Dev Link:</strong> <a href={devLink} className="underline">{devLink}</a>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? (
              <>
                <div className="spinner" />
                Sending link…
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
