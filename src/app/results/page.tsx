
import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "../../utils/supabase-server";

type ResultEntry = {
  id: string;
  position: number | null;
  points: number;
  participant: {
    full_name: string;
    team_id: string | null;
  } | null;
  group: {
    group_name: string;
    team_id: string | null;
  } | null;
};

type ResultSet = {
  id: string;
  competition: { name: string } | null;
  result_entries: ResultEntry[];
};

async function ResultsData() {
  await connection();

  const supabase = await createClient();

  const [
    { data, error },
    { data: teamRows, error: teamError },
  ] = await Promise.all([
    supabase
      .from("result_sets")
      .select(`
        id,
        competition:competitions (
          name
        ),
        result_entries (
          id,
          position,
          points,
          participant:participants (
            full_name,
            team_id
          ),
          group:competition_groups (
            group_name,
            team_id
          )
        )
      `)
      .eq("status", "PUBLISHED")
      .order("published_at", { ascending: false }),

    supabase
      .from("teams")
      .select("id, name"),
  ]);

  const resultSets = (data ?? []) as unknown as ResultSet[];

  const teamById = new Map(
    (teamRows ?? []).map((team: any) => [
      team.id,
      team.name,
    ])
  );

  const competitions = resultSets
    .map((item) => ({
      id: item.id,
      name: item.competition?.name ?? "Competition",

      entries: (item.result_entries ?? [])
        .filter(
          (entry) =>
            entry.position !== null &&
            [1, 2, 3].includes(entry.position)
        )
        .sort(
          (a, b) => (a.position ?? 0) - (b.position ?? 0)
        )
        .map((entry) => {
          const teamId =
            entry.participant?.team_id ??
            entry.group?.team_id ??
            null;

          return {
            id: entry.id,
            position: entry.position!,

            name:
              entry.participant?.full_name ??
              entry.group?.group_name ??
              "Unknown",

            team_name: teamId
              ? teamById.get(teamId) ?? "-"
              : "-",

            points: Number(entry.points),
          };
        }),
    }))
    .filter((item) => item.entries.length > 0);

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-5 py-16 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold tracking-[0.3em] text-yellow-400">
          SAFA ARTS FEST 2K27
        </p>

        <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
          Competition Results
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-gray-400">
          Follow the results and achievements of participants
          across SAFA ARTS FEST 2K27.
        </p>

        {error || teamError ? (
          <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <p className="text-red-400">
              Unable to load results. Please try again later.
            </p>
          </div>
        ) : competitions.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-white/20 p-10 text-center">
            <h2 className="text-xl font-semibold text-gray-300">
              Results will appear here.
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              Only officially published results will be displayed.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            {competitions.map((competition) => (
              <section
                key={competition.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#151515]"
              >
                <h2 className="border-b border-white/10 px-5 py-5 text-xl font-bold text-yellow-400 sm:px-7">
                  {competition.name}
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-xs tracking-wider text-gray-500">
                        <th className="px-5 py-4 sm:px-7">
                          POSITION
                        </th>

                        <th className="px-5 py-4">
                          NAME
                        </th>

                        <th className="px-5 py-4">
                          TEAM NAME
                        </th>

                        <th className="px-5 py-4 text-right sm:px-7">
                          POINTS
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {competition.entries.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="px-5 py-5 font-bold text-yellow-400 sm:px-7">
                            {entry.position === 1
                              ? "1st"
                              : entry.position === 2
                                ? "2nd"
                                : "3rd"}
                          </td>

                          <td className="px-5 py-5 font-medium text-white">
                            {entry.name}
                          </td>

                          <td className="px-5 py-5 text-gray-300">
                            {entry.team_name}
                          </td>

                          <td className="whitespace-nowrap px-5 py-5 text-right font-bold text-white sm:px-7">
                            {entry.points} Points
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0b0b0b] p-10 text-center text-white">
          Loading results...
        </main>
      }
    >
      <ResultsData />
    </Suspense>
  );
}
