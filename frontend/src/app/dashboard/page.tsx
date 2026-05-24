"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface PlanInstance {
  id: string;
  textbook_url: string;
  syllabus_url: string;
  routine_url: string;
  holiday_calendar_url: string;
  session_start: string;
  session_end: string;
  status: "pending" | "processing" | "completed" | "failed";
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
  const labelMap: Record<string, string> = {
    pending: "Draft",
    processing: "Awaiting Approval",
    completed: "Approved",
    failed: "Review Required",
  };
  return (
    <span className={`badge badge-${status}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor[status] || ""}`} />
      {labelMap[status] || status}
    </span>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

export default function DashboardPage() {
  const [plans, setPlans] = useState<PlanInstance[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPlans() {
    try {
      const data = await apiFetch<{ plans: PlanInstance[] }>("/api/plans");
      setPlans(data.plans);
    } catch {
      // silently fail on poll
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlans();

    // Poll every 10s for status updates
    const interval = setInterval(loadPlans, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this plan instance?")) return;
    try {
      await apiFetch(`/api/plans/${id}`, { method: "DELETE" });
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Failed to delete plan instance");
    }
  }

  // Stats
  const stats = {
    total: plans.length,
    pending: plans.filter((p) => p.status === "pending").length,
    processing: plans.filter((p) => p.status === "processing").length,
    completed: plans.filter((p) => p.status === "completed").length,
    failed: plans.filter((p) => p.status === "failed").length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Plan Instances
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage your academic lesson plan generation tasks
          </p>
        </div>
        <Link href="/dashboard/new" className="btn-primary">
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
          New Plan
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total", value: stats.total, color: "var(--text-primary)" },
          { label: "Pending", value: stats.pending, color: "var(--warning)" },
          {
            label: "Processing",
            value: stats.processing,
            color: "var(--processing)",
          },
          {
            label: "Completed",
            value: stats.completed,
            color: "var(--success)",
          },
          { label: "Failed", value: stats.failed, color: "var(--error)" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-[var(--text-muted)]">No plan instances yet</p>
            <Link
              href="/dashboard/new"
              className="btn-primary mt-4 inline-flex"
            >
              Create your first plan
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-glass)]">
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-4">
                    Session
                  </th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-4">
                    Created
                  </th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-4">
                    Updated
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, i) => (
                  <tr
                    key={plan.id}
                    className="table-row border-b border-[var(--border-glass)] last:border-0"
                    style={{
                      animation: `fade-in 0.3s ease-out ${i * 0.05}s both`,
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {formatDate(plan.session_start)} –{" "}
                        {formatDate(plan.session_end)}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-1 font-mono truncate max-w-[200px]">
                        Plan Instance #{String(plans.length - i).padStart(2, '0')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={plan.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {formatDateTime(plan.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {formatDateTime(plan.updated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-4 h-full">
                        <Link
                          href={`/dashboard/${plan.id}`}
                          className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors font-medium"
                        >
                          View →
                        </Link>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="text-sm text-[var(--error)] hover:text-red-700 transition-colors font-medium"
                          title="Delete Plan"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
