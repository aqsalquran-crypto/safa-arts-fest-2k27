
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveFestScore,
  deleteFestScore,
} from "./actions";

type Category = {
  id: string;
  name: string;
};

type Competition = {
  id: string;
  name: string;
  eligible_category_ids: string[];
};

type Score = {
  id: string;
  category: string;
  competition_id: string;
  fasaha_points: number;
  balagha_points: number;
};

type Props = {
  competitions: Competition[];
  categories: Category[];
  scores: Score[];
  error?: string;
};

const FEST_CATEGORIES = [
  { id: "BIDAYA", name: "BIDĀYA" },
  { id: "THANAVIYYA", name: "THANAVIYYA" },
  { id: "ALIYA", name: "ALIYA" },
  { id: "KULLIYYA", name: "KULLIYYA" },
];

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/gi, "")
    .toUpperCase();

export default function ScoreboardClient({
  competitions,
  categories,
  scores,
  error = "",
}: Props) {
  const router = useRouter();

  const [category, setCategory] = useState("BIDAYA");
  const [competitionId, setCompetitionId] = useState("");
  const [fasaha, setFasaha] = useState("0");
  const [balagha, setBalagha] = useState("0");

  const [drafts, setDrafts] = useState<
    Record<string, { fasaha: string; balagha: string }>
  >({});

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedCategory = categories.find(
    (item) => normalize(item.name) === category
  );

  const availableCompetitions = useMemo(() => {
    if (!selectedCategory) return [];

    return competitions.filter((competition) =>
      competition.eligible_category_ids.includes(selectedCategory.id)
    );
  }, [competitions, selectedCategory]);

  const categoryScores = scores.filter(
    (score) => score.category === category
  );

  const fasahaTotal = categoryScores.reduce(
    (sum, score) => sum + score.fasaha_points,
    0
  );

  const balaghaTotal = categoryScores.reduce(
    (sum, score) => sum + score.balagha_points,
    0
  );

  const selectedCompetition = competitions.find(
    (item) => item.id === competitionId
  );

  const alreadySaved = scores.some(
    (score) =>
      score.category === category &&
      score.competition_id === competitionId
  );

  async function handleSave() {
    if (!competitionId) {
      setMessage("Please select a competition.");
      return;
    }

    const fasahaPoints = Number(fasaha);
    const balaghaPoints = Number(balagha);

    if (
      !Number.isSafeInteger(fasahaPoints) ||
      !Number.isSafeInteger(balaghaPoints) ||
      fasahaPoints < 0 ||
      balaghaPoints < 0
    ) {
      setMessage("Enter valid non-negative whole numbers.");
      return;
    }

    setBusy(true);
    setMessage("");

    const result = await saveFestScore(
      category,
      competitionId,
      fasahaPoints,
      balaghaPoints
    );

    setBusy(false);
    setMessage(result.message);

    if (result.success) {
      setCompetitionId("");
      setFasaha("0");
      setBalagha("0");
      router.refresh();
    }
  }

  async function handleUpdate(score: Score) {
    const draft = drafts[score.id];

    const fasahaPoints = Number(draft?.fasaha ?? score.fasaha_points);
    const balaghaPoints = Number(draft?.balagha ?? score.balagha_points);

    if (
      !Number.isSafeInteger(fasahaPoints) ||
      !Number.isSafeInteger(balaghaPoints) ||
      fasahaPoints < 0 ||
      balaghaPoints < 0
    ) {
      setMessage("Enter valid non-negative whole numbers.");
      return;
    }

    setBusy(true);
    setMessage("");

    const result = await saveFestScore(
      score.category,
      score.competition_id,
      fasahaPoints,
      balaghaPoints
    );

    setBusy(false);
    setMessage(result.message);

    if (result.success) {
      setDrafts((previous) => {
        const next = { ...previous };
        delete next[score.id];
        return next;
      });

      router.refresh();
    }
  }

  async function handleDelete(scoreId: string) {
    if (!window.confirm("Are you sure you want to delete this score?")) {
      return;
    }

    setBusy(true);
    setMessage("");

    const result = await deleteFestScore(scoreId);

    setBusy(false);
    setMessage(result.message);

    if (result.success) {
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-5 py-12 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.3em] text-green-400">
              SAFA ARTS FEST 2K27 · WAQOOLU
            </p>

            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Scoreboard Management
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Manually manage FASAHA and BALAGHA points.
            </p>
          </div>

          <a
            href="/leaderboard"
            target="_blank"
            className="rounded-lg border border-white/15 px-5 py-3 text-sm text-green-400 hover:border-green-400"
          >
            View Public Leaderboard ↗
          </a>
        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            Data loading error: {error}
          </div>
        )}

        {message && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            {message}
          </div>
        )}

        {/* CATEGORY SELECTOR */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FEST_CATEGORIES.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCategory(item.id);
                setCompetitionId("");
                setMessage("");
              }}
              className={`rounded-xl border p-4 font-bold transition ${
                category === item.id
                  ? "border-green-500 bg-green-500/15 text-green-400"
                  : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/30"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {!selectedCategory && (
          <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-300">
            The selected category was not found in your categories table.
            Check that the database category is named BIDĀYA, THANAVIYYA,
            ALIYA or KULLIYYA.
          </div>
        )}

        {/* CATEGORY TOTALS */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#168343]/40 bg-[#168343]/10 p-7">
            <p className="text-sm font-semibold text-gray-400">
              FASAHA · {FEST_CATEGORIES.find((item) => item.id === category)?.name}
            </p>
            <p className="mt-3 text-4xl font-extrabold text-[#168343]">
              {fasahaTotal}
            </p>
            <p className="mt-1 text-xs text-gray-500">Total points</p>
          </div>

          <div className="rounded-2xl border border-[#2463C7]/40 bg-[#2463C7]/10 p-7">
            <p className="text-sm font-semibold text-gray-400">
              BALAGHA · {FEST_CATEGORIES.find((item) => item.id === category)?.name}
            </p>
            <p className="mt-3 text-4xl font-extrabold text-[#2463C7]">
              {balaghaTotal}
            </p>
            <p className="mt-1 text-xs text-gray-500">Total points</p>
          </div>
        </div>

        {/* ADD SCORE */}
        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-xl font-bold">Add Competition Score</h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm text-gray-400">
                Competition
              </label>

              <select
                value={competitionId}
                onChange={(event) => {
                  const id = event.target.value;
                  setCompetitionId(id);

                  const existing = scores.find(
                    (score) =>
                      score.category === category &&
                      score.competition_id === id
                  );

                  setFasaha(String(existing?.fasaha_points ?? 0));
                  setBalagha(String(existing?.balagha_points ?? 0));
                }}
                className="w-full rounded-xl border border-white/10 bg-[#151515] px-4 py-4 text-white outline-none focus:border-green-500"
              >
                <option value="">Select a competition</option>

                {availableCompetitions.map((competition) => (
                  <option key={competition.id} value={competition.id}>
                    {competition.name}
                  </option>
                ))}
              </select>

              {selectedCategory && availableCompetitions.length === 0 && (
                <p className="mt-2 text-sm text-yellow-400">
                  No competitions are assigned to this category.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#168343]">
                FASAHA Points
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={fasaha}
                onChange={(event) => setFasaha(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#151515] px-4 py-4 text-white outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#2463C7]">
                BALAGHA Points
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={balagha}
                onChange={(event) => setBalagha(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#151515] px-4 py-4 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={busy || !competitionId}
            className="mt-6 w-full rounded-xl bg-green-600 px-6 py-4 font-bold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {busy
              ? "Saving..."
              : alreadySaved
                ? "Update Score"
                : "Save Score"}
          </button>

          {competitionId && alreadySaved && (
            <p className="mt-3 text-sm text-yellow-400">
              A score already exists for this competition. Saving will update it.
            </p>
          )}
        </section>

        {/* EXISTING SCORES */}
        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold">
              {FEST_CATEGORIES.find((item) => item.id === category)?.name} Scores
            </h2>

            <span className="text-sm text-gray-500">
              {categoryScores.length} competitions
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {categoryScores.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-gray-500">
                No scores entered for this category yet.
              </div>
            ) : (
              categoryScores.map((score) => {
                const competition = competitions.find(
                  (item) => item.id === score.competition_id
                );

                return (
                  <div
                    key={score.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-bold">
                        {competition?.name ?? "Competition"}
                      </h3>

                      <button
                        onClick={() => handleDelete(score.id)}
                        disabled={busy}
                        className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-[#168343]">
                          FASAHA
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            drafts[score.id]?.fasaha ??
                            String(score.fasaha_points)
                          }
                          onChange={(event) =>
                            setDrafts((previous) => ({
                              ...previous,
                              [score.id]: {
                                fasaha:
                                  event.target.value,
                                balagha:
                                  previous[score.id]?.balagha ??
                                  String(score.balagha_points),
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-green-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-[#2463C7]">
                          BALAGHA
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            drafts[score.id]?.balagha ??
                            String(score.balagha_points)
                          }
                          onChange={(event) =>
                            setDrafts((previous) => ({
                              ...previous,
                              [score.id]: {
                                fasaha:
                                  previous[score.id]?.fasaha ??
                                  String(score.fasaha_points),
                                balagha:
                                  event.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpdate(score)}
                      disabled={busy || !drafts[score.id]}
                      className="mt-4 rounded-lg border border-green-500/40 px-5 py-2 text-sm font-semibold text-green-400 transition hover:bg-green-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Save Changes
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
