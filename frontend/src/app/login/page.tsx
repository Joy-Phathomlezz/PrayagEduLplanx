"use client";

import { useState, FormEvent, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessage("Account created successfully! Please sign in.");
    }
    if (searchParams.get("reset") === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessage("Password reset successfully! Please sign in.");
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch<{ token: string; school: { name: string } }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
          skipAuth: true,
        }
      );
      localStorage.setItem("token", data.token);
      localStorage.setItem("schoolName", data.school.name);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-md p-8 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--accent)] mb-4">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Prayag EduPlan
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            School Lesson Planning Platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider"
            >
              School Domain
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@school.com"
              className="input-field"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          {message && (
            <div className="text-sm text-[var(--success)] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] rounded-lg p-3 animate-fade-in">
              {message}
            </div>
          )}

          {error && (
            <div className="text-sm text-[var(--error)] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 animate-fade-in">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center text-sm">
            <Link href="/forgot-password" className="text-[var(--accent)] hover:underline">
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center"
          >
            {loading ? (
              <>
                <div className="spinner" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[var(--accent)] hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
