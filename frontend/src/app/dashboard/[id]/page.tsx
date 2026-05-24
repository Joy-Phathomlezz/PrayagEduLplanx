"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface PlanDetail {
  id: string;
  school_id: number;
  textbook_url: string;
  syllabus_url: string;
  routine_url: string;
  holiday_calendar_url: string;
  session_start: string;
  session_end: string;
  status: "pending" | "processing" | "completed" | "failed";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result_json: any;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const dotColor: Record<string, string> = {
    pending: "bg-[var(--warning)]",
    processing: "bg-[var(--processing)]",
    completed: "bg-[var(--success)]",
    failed: "bg-[var(--error)]",
  };
  return (
    <span className={`badge badge-${status}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor[status] || ""}`} />
      {status}
    </span>
  );
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Generic JSON Renderer ────────────────────────────────────────────────────

/**
 * Determines how to best render a JSON value:
 *  - Primitives  → inline pill
 *  - Flat object (all primitive values) → key/value grid
 *  - Array of primitives → comma-separated chips
 *  - Everything else → recursive tree
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPrimitive(v: any): v is string | number | boolean | null {
  return v === null || typeof v !== "object";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isFlatObject(obj: any): boolean {
  return (
    obj !== null &&
    typeof obj === "object" &&
    !Array.isArray(obj) &&
    Object.values(obj).every(isPrimitive)
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isFlatArray(arr: any): boolean {
  return Array.isArray(arr) && arr.every(isPrimitive);
}

function PrimitiveValue({ value }: { value: string | number | boolean | null }) {
  if (value === null) return <span className="text-[var(--text-muted)] italic">null</span>;
  if (typeof value === "boolean")
    return (
      <span
        className={`text-xs font-mono px-1.5 py-0.5 rounded ${value
            ? "bg-[var(--success)]/15 text-[var(--success)]"
            : "bg-[var(--error)]/15 text-[var(--error)]"
          }`}
      >
        {String(value)}
      </span>
    );
  if (typeof value === "number")
    return <span className="text-[var(--accent)] font-mono font-semibold">{value}</span>;
  return <span className="text-[var(--text-primary)] font-mono text-sm break-all">{String(value)}</span>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function JsonNode({ data, depth = 0 }: { data: any; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth >= 2);

  if (isPrimitive(data)) return <PrimitiveValue value={data} />;

  // Flat array of primitives → chips
  if (isFlatArray(data)) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {(data as (string | number | boolean | null)[]).map((item, i) => (
          <span
            key={i}
            className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-mono"
          >
            <PrimitiveValue value={item} />
          </span>
        ))}
      </div>
    );
  }

  // Flat object → key/value grid
  if (isFlatObject(data)) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between items-start gap-3 py-1 border-b border-[var(--border-glass)]/40 last:border-0">
            <span className="text-xs text-[var(--text-muted)] capitalize flex-shrink-0">
              {key.replace(/_/g, " ")}
            </span>
            <span className="text-right">
              <PrimitiveValue value={value as string | number | boolean | null} />
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Array of objects or mixed → numbered list
  if (Array.isArray(data)) {
    return (
      <div className="mt-2 space-y-3">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            ▶ Show {data.length} item{data.length !== 1 ? "s" : ""}
          </button>
        ) : (
          <>
            {data.length > 3 && (
              <button
                onClick={() => setCollapsed(true)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                ▲ Collapse
              </button>
            )}
            {data.map((item, i) => (
              <div
                key={i}
                className="pl-3 border-l-2 border-[var(--accent)]/30 hover:border-[var(--accent)] transition-colors"
              >
                <span className="text-[0.65rem] text-[var(--text-muted)] font-mono mb-1 block">
                  [{i}]
                </span>
                <JsonNode data={item} depth={depth + 1} />
              </div>
            ))}
          </>
        )}
      </div>
    );
  }

  // Nested object → recursive
  const entries = Object.entries(data);
  return (
    <div className="mt-2 space-y-4">
      {entries.map(([key, value]) => (
        <div key={key}>
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider capitalize">
            {key.replace(/_/g, " ")}
          </span>
          <div className={depth < 3 ? "pl-3 mt-1" : "mt-1"}>
            <JsonNode data={value} depth={depth + 1} />
          </div>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function JsonResultSection({ sectionKey, data }: { sectionKey: string; data: any }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="glass-card p-6 shadow-sm border-l-4 border-l-[var(--accent)]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 group"
      >
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider capitalize">
          {sectionKey.replace(/_/g, " ")}
        </h3>
        <span className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors text-xs select-none">
          {open ? "▲ collapse" : "▼ expand"}
        </span>
      </button>

      {open && (
        <div className="mt-4">
          <JsonNode data={data} depth={0} />
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GenericResultViewer({ result }: { result: any }) {
  if (!result || typeof result !== "object") return null;

  const entries = Object.entries(result);

  return (
    <div className="space-y-6 animate-fade-in mt-8">
      <h2 className="text-xl font-bold text-[var(--accent)] tracking-wider mb-6">
        Generated Lesson Plan Output
      </h2>
      {entries.map(([key, value]) => (
        <JsonResultSection key={key} sectionKey={key} data={value} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanDetailPage() {
  const params = useParams();
  const planId = params.id as string;
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPlan() {
    try {
      const data = await apiFetch<{ plan: PlanDetail }>(`/api/plans/${planId}`);
      setPlan(data.plan);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load plan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlan();
    const interval = setInterval(() => {
      loadPlan();
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <p className="text-[var(--error)] mb-4">{error || "Plan not found"}</p>
        <Link href="/dashboard" className="btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const resourceLinks = [
    { label: "Textbook", url: plan.textbook_url },
    { label: "Syllabus", url: plan.syllabus_url },
    { label: "Routine", url: plan.routine_url },
    { label: "Holiday Calendar", url: plan.holiday_calendar_url },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mb-4 inline-flex items-center gap-1"
        >
          ← Back to Dashboard
        </Link>
        <div className="flex items-center gap-4 mt-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Plan Instance
          </h1>
          <StatusBadge status={plan.status} />
        </div>
        <p className="text-sm text-[var(--text-muted)] font-mono mt-1">
          {plan.id}
        </p>
      </div>

      <div className="space-y-6">
        {/* Info Grid */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Session Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-[var(--text-muted)]">Session Start</span>
              <p className="text-sm text-[var(--text-primary)] mt-1">
                {formatDate(plan.session_start)}
              </p>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">Session End</span>
              <p className="text-sm text-[var(--text-primary)] mt-1">
                {formatDate(plan.session_end)}
              </p>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">Created</span>
              <p className="text-sm text-[var(--text-primary)] mt-1">
                {formatDateTime(plan.created_at)}
              </p>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">Last Updated</span>
              <p className="text-sm text-[var(--text-primary)] mt-1">
                {formatDateTime(plan.updated_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Academic Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resourceLinks.map((r) => (
              <a
                key={r.label}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-glass)] hover:border-[var(--accent)] transition-colors group"
              >
                <svg
                  className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                <div className="min-w-0">
                  <div className="text-xs text-[var(--text-muted)]">{r.label}</div>
                  <div className="text-sm text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                    {r.url}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Error */}
        {plan.status === "failed" && plan.error_message && (
          <div className="glass-card p-6 border-[var(--error)]/30">
            <h2 className="text-sm font-semibold text-[var(--error)] uppercase tracking-wider mb-3">
              Error
            </h2>
            <p className="text-sm text-[var(--text-secondary)] font-mono whitespace-pre-wrap">
              {plan.error_message}
            </p>
          </div>
        )}

        {/* Processing Indicator */}
        {(plan.status === "pending" || plan.status === "processing") && (
          <div className="glass-card p-6 text-center">
            <div className="spinner mx-auto mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">
              {plan.status === "pending"
                ? "Waiting in queue…"
                : "Processing by GPU worker…"}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Auto-refreshing every 5 seconds
            </p>
          </div>
        )}

        {/* Result — fully generic renderer */}
        {plan.status === "completed" && plan.result_json && (
          <GenericResultViewer result={plan.result_json} />
        )}
      </div>
    </div>
  );
}