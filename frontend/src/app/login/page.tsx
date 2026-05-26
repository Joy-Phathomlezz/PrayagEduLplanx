"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const adminUser = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
  const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (email === adminUser && password === adminPass) {
         localStorage.setItem("userRole", "admin");
         router.push("/dashboard");
      } else {
         setError("Invalid credentials");
      }
      setLoading(false);
    }, 500);
  };

  const handleDirectAdmin = () => {
    setEmail(adminUser || "demo@school");
    setPassword(adminPass || "pass123");
    
    // Auto-submit for "direct" feel
    localStorage.setItem("userRole", "admin");
    router.push("/dashboard");
  };

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
            PrayagEdu Lesson Plan
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
              Username
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

          {error && (
            <div className="text-sm text-[var(--error)] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 animate-fade-in">
              {error}
            </div>
          )}

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
