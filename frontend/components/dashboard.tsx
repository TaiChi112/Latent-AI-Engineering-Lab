"use client";

import { useEffect, useState } from "react";

type UserSummary = {
  user_id: string;
  segment: string;
  train_history_count: number;
  hidden_future_count: number;
};

type Recommendation = {
  item_id: string;
  title: string;
  category: string;
  price: number;
  score: number;
  reason: string;
};

type RecommendationResponse = {
  user_id: string;
  model: "popularity" | "item_cooccurrence";
  recommendations: Recommendation[];
  train_history_item_ids: string[];
};

type EvaluationResponse = {
  user_id: string;
  model: "popularity" | "item_cooccurrence";
  k: number;
  metrics: {
    precision_at_k: number;
    recall_at_k: number;
    hit_rate: number;
  };
  hidden_future_item_ids: string[];
  hits: string[];
  misses: string[];
};

type DashboardSummary = {
  users: number;
  items: number;
  train_interactions: number;
  hidden_future_interactions: number;
  models: Array<{
    model: "popularity" | "item_cooccurrence";
    precision_at_k: number;
    recall_at_k: number;
    hit_rate: number;
  }>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/80 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="glass max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/70 shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Details</p>
            <h3 className="mt-1 text-2xl font-semibold text-ink">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Close
          </button>
        </div>
        <div className="max-h-[calc(85vh-88px)] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [model, setModel] = useState<"popularity" | "item_cooccurrence">("item_cooccurrence");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Recommendation | null>(null);
  const [activeModal, setActiveModal] = useState<"insights" | "compare" | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [usersResult, summaryResult] = await Promise.all([
          fetchJson<UserSummary[]>("/users"),
          fetchJson<DashboardSummary>("/dashboard/summary?k=6"),
        ]);
        setUsers(usersResult);
        setSummary(summaryResult);
        setSelectedUserId(usersResult[0]?.user_id ?? "");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    const loadUserData = async () => {
      try {
        setError(null);
        await fetchJson("/auth/mock-login", {
          method: "POST",
          body: JSON.stringify({ user_id: selectedUserId }),
        });

        const [recommendationResult, evaluationResult] = await Promise.all([
          fetchJson<RecommendationResponse>(
            `/users/${selectedUserId}/recommendations?model=${model}&k=6`,
          ),
          fetchJson<EvaluationResponse>(`/users/${selectedUserId}/evaluation?model=${model}&k=6`),
        ]);
        setRecommendations(recommendationResult);
        setEvaluation(evaluationResult);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load user data");
      }
    };

    void loadUserData();
  }, [selectedUserId, model]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-slate-700">
        Loading recommender workspace...
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-4 lg:h-screen lg:overflow-hidden lg:px-6 lg:py-5">
        <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1fr)_280px] lg:grid-rows-[auto_minmax(0,1fr)]">
          <section className="glass rounded-[2rem] border border-white/60 p-5 shadow-card lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">MVP Sandbox</p>
                <h1 className="mt-2 text-3xl font-semibold leading-tight text-ink lg:text-4xl">
                  Recommender MVP
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600 lg:text-base">
                  Test dataset user login, personalized recommendations, and hidden-future evaluation in one compact workspace.
                </p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-[420px]">
                <MetricCard label="Users" value={String(summary?.users ?? 0)} />
                <MetricCard label="Catalog" value={String(summary?.items ?? 0)} />
                <MetricCard label="Holdout" value={String(summary?.hidden_future_interactions ?? 0)} />
              </div>
            </div>
          </section>

          <section className="glass rounded-[2rem] border border-white/60 p-5 shadow-card lg:col-start-1 lg:flex lg:min-h-0 lg:flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Recommendations</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Personalized picks</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Click any card to view full details in a popup.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                  {recommendations?.recommendations.length ?? 0} items
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {model}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {recommendations?.recommendations.map((item) => {
                const isHit = evaluation?.hits.includes(item.item_id) ?? false;
                return (
                  <button
                    key={item.item_id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="flex min-h-[210px] flex-col rounded-3xl border border-slate-200 bg-white/85 p-5 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                          {item.category}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold leading-7 text-ink">
                          {item.title}
                        </h3>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                          isHit
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isHit ? "Hit" : "Candidate"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5">ID: {item.item_id}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1.5">
                        Score: {item.score}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1.5">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>

                    <p className="mt-4 max-h-16 overflow-hidden text-sm leading-6 text-slate-600">
                      {item.reason}
                    </p>

                    <div className="mt-auto pt-4">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${isHit ? "bg-emerald-500" : "bg-ember"}`}
                          style={{ width: `${Math.min(item.score * 18, 100)}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3 border-t border-slate-200/80 pt-4 sm:grid-cols-3">
              <MetricCard label="Precision" value={String(evaluation?.metrics.precision_at_k ?? 0)} />
              <MetricCard label="Recall" value={String(evaluation?.metrics.recall_at_k ?? 0)} />
              <MetricCard label="Hit Rate" value={String(evaluation?.metrics.hit_rate ?? 0)} />
            </div>
          </section>

          <section className="glass rounded-[2rem] border border-white/60 p-5 shadow-card lg:col-start-2 lg:flex lg:min-h-0 lg:flex-col">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Control Panel</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Workspace</h2>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                Live
              </span>
            </div>

            <div className="mt-5 space-y-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              <label className="block text-sm font-medium text-slate-700">
                Dataset user
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-ember"
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                >
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.user_id} - {user.segment}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Model
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-ember"
                  value={model}
                  onChange={(event) =>
                    setModel(event.target.value as "popularity" | "item_cooccurrence")
                  }
                >
                  <option value="item_cooccurrence">Item co-occurrence</option>
                  <option value="popularity">Popularity baseline</option>
                </select>
              </label>

              <div className="rounded-3xl bg-slate-900 px-4 py-4 text-sm text-slate-100">
                {users
                  .filter((user) => user.user_id === selectedUserId)
                  .map((user) => (
                    <div key={user.user_id}>
                      <p>
                        Signed in as <span className="font-semibold">{user.user_id}</span>
                      </p>
                      <p className="mt-2 text-slate-300">Segment: {user.segment}</p>
                      <p className="mt-1 text-slate-300">
                        Train {user.train_history_count} · Future {user.hidden_future_count}
                      </p>
                    </div>
                  ))}
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal("insights")}
                  className="rounded-2xl bg-white/85 px-4 py-3 text-left text-sm font-medium text-ink transition hover:bg-white"
                >
                  Open User Insights
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal("compare")}
                  className="rounded-2xl bg-white/85 px-4 py-3 text-left text-sm font-medium text-ink transition hover:bg-white"
                >
                  Open Model Comparison
                </button>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      <Modal open={selectedItem !== null} title={selectedItem?.title ?? ""} onClose={() => setSelectedItem(null)}>
        {selectedItem ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 text-sm text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-2">{selectedItem.category}</span>
              <span className="rounded-full bg-slate-100 px-3 py-2">ID: {selectedItem.item_id}</span>
              <span className="rounded-full bg-slate-100 px-3 py-2">Score: {selectedItem.score}</span>
              <span className="rounded-full bg-slate-100 px-3 py-2">${selectedItem.price.toFixed(2)}</span>
            </div>

            <div className="rounded-3xl bg-white/80 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Recommendation reason</p>
              <p className="mt-3 text-base leading-7 text-slate-700">{selectedItem.reason}</p>
            </div>

            <div className="rounded-3xl bg-white/80 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Hidden future match</p>
              <p className="mt-3 text-base text-slate-700">
                {evaluation?.hits.includes(selectedItem.item_id)
                  ? "This recommendation matches a hidden future purchase."
                  : "This recommendation does not match the hidden future purchase."}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={activeModal === "insights"} title="User Insights" onClose={() => setActiveModal(null)}>
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Precision" value={String(evaluation?.metrics.precision_at_k ?? 0)} />
            <MetricCard label="Recall" value={String(evaluation?.metrics.recall_at_k ?? 0)} />
            <MetricCard label="Hit Rate" value={String(evaluation?.metrics.hit_rate ?? 0)} />
          </div>

          <div className="rounded-3xl bg-white/80 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Train history</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(recommendations?.train_history_item_ids ?? []).map((itemId) => (
                <span key={itemId} className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  {itemId}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/80 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Hidden future purchases</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(evaluation?.hidden_future_item_ids ?? []).map((itemId) => (
                <span key={itemId} className="rounded-full bg-gold/40 px-3 py-2 text-sm text-ink">
                  {itemId}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-600">Hits: {(evaluation?.hits ?? []).join(", ") || "None"}</p>
            <p className="mt-2 text-sm text-slate-600">Misses: {(evaluation?.misses ?? []).join(", ") || "None"}</p>
          </div>
        </div>
      </Modal>

      <Modal open={activeModal === "compare"} title="Model Comparison" onClose={() => setActiveModal(null)}>
        <div className="space-y-3">
          {summary?.models.map((item) => (
            <div key={item.model} className="rounded-3xl bg-white/80 p-5">
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-lg font-semibold text-ink">{item.model}</h4>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
                  Hit rate {item.hit_rate}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MetricCard label="Precision@6" value={String(item.precision_at_k)} />
                <MetricCard label="Recall@6" value={String(item.recall_at_k)} />
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
