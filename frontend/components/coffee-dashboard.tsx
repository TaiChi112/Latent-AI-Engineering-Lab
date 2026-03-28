"use client";

import Link from "next/link";
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

type CoffeeInsight = {
  user_id: string;
  favorite_drink: string | null;
  favorite_food: string | null;
  preferred_daypart: string | null;
  common_pairings: Array<{
    items: string[];
    count: number;
  }>;
  recent_order_item_ids: string[];
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="glass max-h-[84vh] w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4">
          <h3 className="text-xl font-semibold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white"
          >
            Close
          </button>
        </div>
        <div className="max-h-[calc(84vh-72px)] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function CoffeeDashboard() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [model, setModel] = useState<"popularity" | "item_cooccurrence">("item_cooccurrence");
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [insights, setInsights] = useState<CoffeeInsight | null>(null);
  const [selectedItem, setSelectedItem] = useState<Recommendation | null>(null);
  const [openInsights, setOpenInsights] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const usersResult = await fetchJson<UserSummary[]>("/coffee/users");
        setUsers(usersResult);
        setSelectedUserId(usersResult[0]?.user_id ?? "");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load coffee app");
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
        await fetchJson("/coffee/auth/mock-login", {
          method: "POST",
          body: JSON.stringify({ user_id: selectedUserId }),
        });

        const [recommendationResult, evaluationResult, insightResult] = await Promise.all([
          fetchJson<RecommendationResponse>(
            `/coffee/users/${selectedUserId}/recommendations?model=${model}&k=6`,
          ),
          fetchJson<EvaluationResponse>(`/coffee/users/${selectedUserId}/evaluation?model=${model}&k=6`),
          fetchJson<CoffeeInsight>(`/coffee/users/${selectedUserId}/insights`),
        ]);

        setRecommendations(recommendationResult);
        setEvaluation(evaluationResult);
        setInsights(insightResult);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load coffee user");
      }
    };

    void loadUserData();
  }, [selectedUserId, model]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading coffee app...</div>;
  }

  return (
    <>
      <div className="min-h-screen px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Coffee Scenario</p>
              <h1 className="mt-2 text-3xl font-semibold text-ink">Coffee Recommendation Web App</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Explore how a cafe recommendation flow works in a standard web app, from user login to drink-food pairing insight.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-ink shadow-card"
            >
              Back To Store MVP
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <section className="glass rounded-[2rem] border border-white/60 p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Cafe Recommender</p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">Control Panel</h2>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                  {model}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Login as dataset user
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
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
                  Recommendation model
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                    value={model}
                    onChange={(event) =>
                      setModel(event.target.value as "popularity" | "item_cooccurrence")
                    }
                  >
                    <option value="item_cooccurrence">Item co-occurrence</option>
                    <option value="popularity">Popularity baseline</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 rounded-[1.5rem] bg-slate-900 px-4 py-4 text-sm text-slate-100">
                <p>
                  Active user <span className="font-semibold">{selectedUserId}</span>
                </p>
                <p className="mt-2 text-slate-300">Favorite drink: {insights?.favorite_drink ?? "-"}</p>
                <p className="mt-1 text-slate-300">Favorite food: {insights?.favorite_food ?? "-"}</p>
                <p className="mt-1 text-slate-300">Preferred time: {insights?.preferred_daypart ?? "-"}</p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-[1.5rem] bg-white/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Precision</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">
                    {evaluation?.metrics.precision_at_k ?? 0}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-white/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Recall</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">
                    {evaluation?.metrics.recall_at_k ?? 0}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-white/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Hit Rate</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">
                    {evaluation?.metrics.hit_rate ?? 0}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpenInsights(true)}
                className="mt-4 w-full rounded-2xl bg-white/85 px-4 py-3 text-sm font-medium text-ink shadow-card transition hover:bg-white"
              >
                Open Behavior Insights
              </button>

              {error ? (
                <div className="mt-4 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </section>

            <section className="glass rounded-[2rem] border border-white/60 p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">For You</p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">Coffee and food picks</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Recommendations blend drink preference, paired ready-to-eat items, and order-time patterns.
                  </p>
                </div>
                <span className="rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {recommendations?.recommendations.length ?? 0} items
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recommendations?.recommendations.map((item) => {
                  const isHit = evaluation?.hits.includes(item.item_id) ?? false;

                  return (
                    <button
                      key={item.item_id}
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-amber-300 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                            {item.category}
                          </p>
                          <h4 className="mt-2 text-lg font-semibold text-ink">{item.title}</h4>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                            isHit ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isHit ? "Hit" : "Pick"}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-white px-3 py-1.5">ID: {item.item_id}</span>
                        <span className="rounded-full bg-white px-3 py-1.5">${item.price.toFixed(2)}</span>
                        <span className="rounded-full bg-white px-3 py-1.5">Score: {item.score}</span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.reason}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      <Modal open={selectedItem !== null} title={selectedItem?.title ?? ""} onClose={() => setSelectedItem(null)}>
        {selectedItem ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-2">{selectedItem.category}</span>
              <span className="rounded-full bg-slate-100 px-3 py-2">${selectedItem.price.toFixed(2)}</span>
              <span className="rounded-full bg-slate-100 px-3 py-2">Score {selectedItem.score}</span>
            </div>

            <div className="rounded-3xl bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Why this is recommended</p>
              <p className="mt-3 text-base leading-7 text-slate-700">{selectedItem.reason}</p>
            </div>

            <div className="rounded-3xl bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Future purchase check</p>
              <p className="mt-3 text-base text-slate-700">
                {evaluation?.hits.includes(selectedItem.item_id)
                  ? "This item appears in the hidden future order."
                  : "This item does not appear in the hidden future order."}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={openInsights} title="Coffee Behavior Insights" onClose={() => setOpenInsights(false)}>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Favorite Drink</p>
              <p className="mt-2 text-sm font-semibold text-ink">{insights?.favorite_drink ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Favorite Food</p>
              <p className="mt-2 text-sm font-semibold text-ink">{insights?.favorite_food ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Preferred Time</p>
              <p className="mt-2 text-sm font-semibold text-ink">{insights?.preferred_daypart ?? "-"}</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Recent order items</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(insights?.recent_order_item_ids ?? []).map((itemId) => (
                <span key={itemId} className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  {itemId}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Most common pairings</p>
            <div className="mt-3 space-y-2">
              {(insights?.common_pairings ?? []).map((pairing, index) => (
                <div
                  key={`${pairing.items.join("-")}-${index}`}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm text-ink">{pairing.items.join(" + ")}</span>
                  <span className="text-sm font-medium text-slate-500">{pairing.count} orders</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Hidden future order</p>
            <p className="mt-3 text-sm text-slate-700">
              {(evaluation?.hidden_future_item_ids ?? []).join(", ") || "No holdout order"}
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
