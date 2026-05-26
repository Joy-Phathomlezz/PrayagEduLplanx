"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface PlanInstance {
  id: string;
  name: string;
  textbook_url: string;
  syllabus_url: string;
  routine_url: string;
  holiday_calendar_url: string;
  session_start: string;
  session_end: string;
  status: "pending" | "processing" | "completed" | "failed" | "callback_sent" | "callback_failed";
  is_callback: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface School {
  id: number;
  name: string;
  domain: string;
  code: string;
  api_key: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const dotColor: Record<string, string> = {
    pending: "bg-[var(--warning)]",
    processing: "bg-[var(--processing)]",
    completed: "bg-[var(--success)]",
    callback_sent: "bg-[var(--success)] opacity-80",
    callback_failed: "bg-[var(--error)]",
    failed: "bg-[var(--error)]",
  };
  const labelMap: Record<string, string> = {
    pending: "Enqueue",
    processing: "Processing",
    completed: "Successful",
    callback_sent: "Callback Sent",
    callback_failed: "Callback Failed",
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

function SchoolsSection() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastGeneratedKey, setLastGeneratedKey] = useState<{ id: number, key: string } | null>(null);

  async function loadSchools() {
    try {
      const data = await apiFetch<{ schools: School[] }>("/schools");
      setSchools(data.schools);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchools();
  }, []);

  async function handleGenerateKey(schoolId: number) {
    if (!confirm("Generating a new key will revoke the existing one. Proceed?")) return;
    try {
      const data = await apiFetch<{ data: { api_key: string } }>(`/schools/${schoolId}/keys`, {
        method: "POST"
      });
      setLastGeneratedKey({ id: schoolId, key: data.data.api_key });
      loadSchools();
    } catch {
      alert("Failed to generate key");
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Schools</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage Keys and Lesson Plan Instances</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-glass)]">
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-4">School Details</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-4">API Key Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {schools.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--border-glass)] last:border-0 hover:bg-[var(--bg-card)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-[var(--text-primary)]">{s.name}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">{s.domain} • Code: {s.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      {lastGeneratedKey?.id === s.id ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-[var(--accent-glass)] p-1 rounded text-[var(--accent)] break-all max-w-[200px] truncate">{lastGeneratedKey.key}</span>
                            <button 
                              onClick={() => { navigator.clipboard.writeText(lastGeneratedKey.key); alert("Copied!"); }}
                              className="text-xs text-[var(--accent)] hover:underline"
                            >Copy</button>
                          </div>
                          <span className="text-[10px] text-[var(--warning)] font-medium uppercase tracking-tighter">Copy now — key won&apos;t be shown again</span>
                        </div>
                      ) : s.api_key ? (
                        <span className="text-xs text-[var(--success)] font-medium bg-[rgba(34,197,94,0.1)] px-2 py-1 rounded">Active (Masked)</span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic">No key generated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleGenerateKey(s.id)} className="btn-secondary py-1 text-xs">
                        {s.api_key ? "Revoke & Regen" : "Generate Key"}
                      </button>
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

function PlansSection() {
  const [plans, setPlans] = useState<PlanInstance[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPlans() {
    try {
      const data = await apiFetch<{ plans: PlanInstance[] }>("/plans");
      setPlans(data.plans);
    } catch {
      // silently fail on v1
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
    const interval = setInterval(loadPlans, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this plan instance?")) return;
    try {
      await apiFetch(`/plans/${id}`, { method: "DELETE" });
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Failed to delete plan instance");
    }
  }

  const stats = {
    total: plans.length,
    pending: plans.filter((p) => p.status === "pending").length,
    processing: plans.filter((p) => p.status === "processing").length,
    completed: plans.filter((p) => p.status === "completed" || p.status === "callback_sent").length,
    failed: plans.filter((p) => p.status === "failed" || p.status === "callback_failed").length,
  };

  return (
    <div className="space-y-8 animate-fade-in" style={{ animationDelay: "150ms" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Plan Instances</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage all academic lesson plan generation tasks</p>
        </div>
        <Link href="/dashboard/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Plan
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total", value: stats.total, color: "var(--text-primary)" },
          { label: "Queued", value: stats.pending, color: "var(--warning)" },
          { label: "Processing", value: stats.processing, color: "var(--processing)" },
          { label: "Completed", value: stats.completed, color: "var(--success)" },
          { label: "Failed", value: stats.failed, color: "var(--error)" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--text-muted)]">No plan instances yet</p>
            <Link href="/dashboard/new" className="btn-primary mt-4 inline-flex">Create your first plan</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-glass)]">
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-4">Plan Name / Session</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-4">Created</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-[var(--border-glass)] last:border-0 hover:bg-[var(--bg-card)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-[var(--text-primary)]">{plan.name || "Unnamed Plan"}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">{formatDate(plan.session_start)} – {formatDate(plan.session_end)}</div>
                      {plan.is_callback ? <span className="text-[10px] uppercase font-bold text-[var(--accent)] mt-1 block">Webhook Enabled</span> : null}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={plan.status} /></td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{formatDateTime(plan.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-4 h-full">
                        <Link href={`/dashboard/${plan.id}`} className="text-sm text-[var(--accent)] font-medium">View →</Link>
                        <button onClick={() => handleDelete(plan.id)} className="text-sm text-[var(--error)]"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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

export default function DashboardPage() {
  return (
    <div className="space-y-12">
      <SchoolsSection />
      
      <div className="flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-glass)] via-[var(--accent-glass)] to-[var(--border-glass)]"></div>
        <div className="w-2 h-2 rounded-full bg-[var(--accent-glass)]"></div>
        <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-glass)] via-[var(--accent-glass)] to-[var(--border-glass)]"></div>
      </div>

      <PlansSection />
    </div>
  );
}
