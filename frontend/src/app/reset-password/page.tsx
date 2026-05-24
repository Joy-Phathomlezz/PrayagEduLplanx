"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(t);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("No reset token provided. Please use the link from your email.");
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await apiFetch<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: password }),
        skipAuth: true,
      });
      setSuccess(res.message);
      setTimeout(() => {
        router.push("/login?reset=true");
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-md p-8 animate-slide-up shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Set New Password</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Please enter your new password below.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field shadow-sm"
              disabled={!token || !!success}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field shadow-sm"
              disabled={!token || !!success}
            />
          </div>

          {error && (
            <div className="text-sm text-[var(--error)] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 animate-fade-in">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-[var(--success)] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] rounded-lg p-3 animate-fade-in">
              {success} Redirecting to login...
            </div>
          )}

          <button type="submit" disabled={loading || !token || !!success} className="btn-primary w-full justify-center">
            {loading ? (
              <>
                <div className="spinner" />
                Resetting…
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
