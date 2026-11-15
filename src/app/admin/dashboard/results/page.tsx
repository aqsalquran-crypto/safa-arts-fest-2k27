
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { createClient } from "../../../../utils/supabase-server";
import ScoreEntry from "./ScoreEntry";
import CompetitionResults from "./CompetitionResults";
import PublishButton from "./PublishButton";

async function ResultsData() {
  await connection();

  const supabase = await createClient();

  const [
    { data: resultSets, error: resultError },
    { count: competitionCount, error: countError },
    { data: competitionRows, error: competitionError },
    { data: registrationRows, error: registrationError },
    { data: groupRows, error: groupError },
  ] = await Promise.all([
    supabase
      .from("result_sets")
      .select(`
        id,
        status,
        published_at,
        competition:competitions (
          id,
          name
        ),
        result_entries (
          id,
          position,
          points,
          participant:participants (
            full_name
          ),
          group:competition_groups (
            group_name
          )
        )
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("competitions")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("competitions")
      .select(`
        id,
        name,
        competition_type,
        competition_categories (
          category_id
        )
      `),

    // Get participants through actual competition registrations.
    supabase
      .from("competition_registrations")
      .select(`
        competition_id,
        participant:participants (
          id,
          full_name,
          tag_number,
          category_id
        )
      `),

    supabase
      .from("competition_groups")
      .select("id, group_name, competition_id"),
  ]);

  const dataError =
    resultError ||
    countError ||
    competitionError ||
    registrationError ||
    groupError;

  const competitions = (competitionRows ?? []).map((item: any) => ({
    id: item.id,
    name: item.name,
    competition_type: item.competition_type,
    category_ids: (item.competition_categories ?? []).map(
      (category: any) => category.category_id
    ),
  }));

  // Each participant is associated with the competition
  // in which they are actually registered.
  const participants = (registrationRows ?? [])
    .filter((registration: any) => registration.participant)
    .map((registration: any) => ({
      ...registration.participant,
      competition_id: registration.competition_id,
    }));

  const groups = groupRows ?? [];

  const results = (resultSets ?? []).map((item: any) => ({
    id: item.id,
    status: item.status,
    published_at: item.published_at,
    competition_name: item.competition?.name ?? "Unknown competition",
    total_entries: item.result_entries?.length ?? 0,
    total_points: (item.result_entries ?? []).reduce(
      (sum: number, entry: any) => sum + Number(entry.points),
      0
    ),
  }));

  const publishedCompetitionResults = (resultSets ?? [])
    .filter((item: any) => item.status === "PUBLISHED")
    .map((item: any) => ({
      id: item.id,
      competition_name: item.competition?.name ?? "Unknown competition",
      entries: (item.result_entries ?? []).map((entry: any) => ({
        id: entry.id,
        position: entry.position,
        points: Number(entry.points),
        participant_name: entry.participant?.full_name ?? "",
        group_name: entry.group?.group_name ?? null,
      })),
    }));

  const totalResults = results.length;

  const draftResults = results.filter(
    (item) => item.status === "DRAFT"
  ).length;

  const publishedResults = results.filter(
    (item) => item.status === "PUBLISHED"
  ).length;

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin/dashboard"
          className="text-sm text-green-400 hover:text-green-300"
        >
          ← Back to Dashboard
        </Link>

        <header className="mt-8">
          <p className="text-sm font-semibold tracking-widest text-green-400">
            ADMIN MANAGEMENT
          </p>

          <h1 className="mt-2 text-4xl font-extrabold">
            Results & Scores
          </h1>

          <p className="mt-2 text-gray-400">
            Enter scores and manage competition results.
          </p>
        </header>

        {dataError && (
          <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            Could not load some results data. Please check database
            permissions and relationships.
          </p>
        )}

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            { label: "Total Results", value: totalResults },
            { label: "Draft Results", value: draftResults },
            { label: "Published Results", value: publishedResults },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/10 bg-white/5 p-6"
            >
              <p className="text-sm text-gray-400">{item.label}</p>
              <h2 className="mt-3 text-3xl font-bold">
                {item.value}
              </h2>
            </div>
          ))}
        </div>

        <section className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Manual Score Entry</h2>

          <p className="mt-2 text-sm text-gray-400">
            Select a competition, registered participant or group,
            position and grade.
          </p>

          <ScoreEntry
            competitions={competitions}
            participants={participants}
            groups={groups}
          />

          <p className="mt-5 text-sm text-gray-400">
            Available competitions: {competitionCount ?? 0}
          </p>
        </section>

        <section className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Competition Results</h2>

          <CompetitionResults
            competitions={publishedCompetitionResults}
          />
        </section>

        <section className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Result Management</h2>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-sm text-gray-400">
                  <th className="px-4 py-4">COMPETITION</th>
                  <th className="px-4 py-4">ENTRIES</th>
                  <th className="px-4 py-4">TOTAL POINTS</th>
                  <th className="px-4 py-4">STATUS</th>
                  <th className="px-4 py-4">PUBLISHED</th>
                  <th className="px-4 py-4">ACTION</th>
                </tr>
              </thead>

              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-16 text-center text-gray-500"
                    >
                      No result sets created yet.
                    </td>
                  </tr>
                ) : (
                  results.map((result) => (
                    <tr
                      key={result.id}
                      className="border-b border-white/5"
                    >
                      <td className="px-4 py-4 font-medium">
                        {result.competition_name}
                      </td>

                      <td className="px-4 py-4">
                        {result.total_entries}
                      </td>

                      <td className="px-4 py-4">
                        {result.total_points}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={
                            result.status === "PUBLISHED"
                              ? "text-green-400"
                              : "text-yellow-400"
                          }
                        >
                          {result.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-gray-400">
                        {result.published_at
                          ? new Date(result.published_at).toLocaleString()
                          : "—"}
                      </td>

                      <td className="px-4 py-4">
                        {result.status === "DRAFT" ? (
                          <PublishButton resultSetId={result.id} />
                        ) : (
                          <span className="text-green-400">
                            Published
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0b0b] p-8 text-white">
          Loading results...
        </div>
      }
    >
      <ResultsData />
    </Suspense>
  );
}
