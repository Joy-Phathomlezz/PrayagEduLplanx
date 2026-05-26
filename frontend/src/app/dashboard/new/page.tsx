"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function NewPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    apiKey: "",
    name: "",
    textbookUrl: "",
    syllabusUrl: "",
    routineUrl: "",
    holidayCalendarUrl: "",
    sessionStart: "",
    sessionEnd: "",
    responseUrl: "",
  });

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { apiKey, name, textbookUrl, syllabusUrl, routineUrl, holidayCalendarUrl, sessionStart, sessionEnd, responseUrl } = form;
      
      await apiFetch("/plans", {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          name: name || undefined,
          textbook_url: textbookUrl,
          syllabus_url: syllabusUrl,
          routine_url: routineUrl,
          holiday_url: holidayCalendarUrl,
          session_start: sessionStart,
          session_end: sessionEnd,
          response_url: responseUrl || undefined,
        }),
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    {
      key: "apiKey",
      label: "School API Key",
      placeholder: "Paste school integration API key here",
      type: "password",
      required: true,
    },
    {
      key: "name",
      label: "Plan Name",
      placeholder: "e.g. Maths-5-ARPS",
      type: "text",
      required: false,
    },
    {
      key: "textbookUrl",
      label: "Textbook URL",
      placeholder: "https://example.com/textbook.pdf",
      type: "url",
      required: true,
    },
    {
      key: "syllabusUrl",
      label: "Syllabus URL",
      placeholder: "https://example.com/syllabus.pdf",
      type: "url",
      required: true,
    },
    {
      key: "routineUrl",
      label: "Routine URL",
      placeholder: "https://example.com/routine.pdf",
      type: "url",
      required: true,
    },
    {
      key: "holidayCalendarUrl",
      label: "Holiday Calendar URL",
      placeholder: "https://example.com/holidays.pdf",
      type: "url",
      required: true,
    },
    {
      key: "sessionStart",
      label: "Academic Session Start",
      placeholder: "",
      type: "date",
      required: true,
    },
    {
      key: "sessionEnd",
      label: "Academic Session End",
      placeholder: "",
      type: "date",
      required: true,
    },
    {
      key: "responseUrl",
      label: "Webhook Callback URL",
      placeholder: "https://your-erp.com/api/callback",
      type: "url",
      required: false,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mb-4 inline-flex items-center gap-1"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-2">
          Create Plan Instance
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Submit academic resources for AI-powered lesson plan generation
        </p>
      </div>

      {/* Form */}
      <div className="glass-card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map((field) => (
            <div key={field.key}>
              <label
                htmlFor={field.key}
                className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider"
              >
                {field.label} {field.required && <span className="text-[var(--error)]">*</span>}
              </label>
              <input
                id={field.key}
                type={field.type}
                required={field.required}
                value={form[field.key as keyof typeof form]}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="input-field"
              />
            </div>
          ))}

          {error && (
            <div className="text-sm text-[var(--error)] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 animate-fade-in">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 justify-center"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Creating…
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Plan Instance
                </>
              )}
            </button>
            <Link href="/dashboard" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
