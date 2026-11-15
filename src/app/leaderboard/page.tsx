
import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "../../utils/supabase-server";

const categories = [
  { id: "BIDAYA", name: "BIDĀYA" },
  { id: "THANAVIYYA", name: "THANAVIYYA" },
  { id: "ALIYA", name: "ALIYA" },
  { id: "KULLIYYA", name: "KULLIYYA" },
];

type Score = {
  id: string;
  category: string;
  fasaha_points: number;
  balagha_points: number;
  competition: { name: string } | null;
};

const teams = [
  { name: "FASAHA", color: "#168343" },
  { name: "BALAGHA", color: "#2463C7" },
];

async function LeaderboardData() {
  await connection();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("fest_scores")
    .select(`
      id,
      category,
      fasaha_points,
      balagha_points,
      competition:competitions(name)
    `)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      "LEADERBOARD ERROR DETAILS:",
      JSON.stringify(error, Object.getOwnPropertyNames(error))
    );
  }

  const scores = (data ?? []) as unknown as Score[];

  const totalFasaha = scores.reduce(
    (sum, score) => sum + score.fasaha_points,
    0
  );

  const totalBalagha = scores.reduce(
    (sum, score) => sum + score.balagha_points,
    0
  );

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-5 py-16 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold tracking-[0.3em] text-yellow-400">
          SAFA ARTS FEST 2K27
        </p>

        <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
          Leaderboard
        </h1>

        <p className="mt-4 text-gray-400">
          Follow FASAHA and BALAGHA throughout the festival.
        </p>

        {/* OVERALL LEADERBOARD */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {teams.map((team) => {
            const points =
              team.name === "FASAHA"
                ? totalFasaha
                : totalBalagha;

            return (
              <div
                key={team.name}
                className="rounded-2xl border p-8 text-center"
                style={{
                  borderColor: `${team.color}80`,
                  backgroundColor: `${team.color}12`,
                }}
              >
                <h2
                  className="text-3xl font-extrabold"
                  style={{ color: team.color }}
                >
                  {team.name}
                </h2>

                <p className="mt-6 text-sm text-gray-400">
                  OVERALL POINTS
                </p>

                <p className="mt-2 text-5xl font-extrabold">
                  {points}
                </p>
              </div>
            );
          })}
        </div>

        {/* CATEGORY SCOREBOARDS */}
        <div className="mt-16">
          <h2 className="mb-8 text-2xl font-extrabold">
            Category Scoreboards
          </h2>

          <div className="space-y-8">
            {categories.map((category) => {
              const categoryScores = scores.filter(
                (score) => score.category === category.id
              );

              const fasahaTotal = categoryScores.reduce(
                (sum, score) => sum + score.fasaha_points,
                0
              );

              const balaghaTotal = categoryScores.reduce(
                (sum, score) => sum + score.balagha_points,
                0
              );

              return (
                <section
                  key={category.id}
                  className="overflow-hidden rounded-2xl border border-white/10"
                >
                  <div className="bg-white/5 p-6">
                    <h3 className="text-2xl font-extrabold">
                      {category.name}
                    </h3>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">
                          FASAHA TOTAL
                        </p>
                        <p className="mt-2 text-3xl font-bold text-[#168343]">
                          {fasahaTotal}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400">
                          BALAGHA TOTAL
                        </p>
                        <p className="mt-2 text-3xl font-bold text-[#2463C7]">
                          {balaghaTotal}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white/[0.03] text-sm text-gray-400">
                        <tr>
                          <th className="px-6 py-4">Competition</th>
                          <th className="px-6 py-4 text-right">Balagha</th>
                          <th className="px-6 py-4 text-right">Fasaha</th>
                        </tr>
                      </thead>

                      <tbody>
                        {categoryScores.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-6 py-8 text-center text-gray-500"
                            >
                              No scores published yet.
                            </td>
                          </tr>
                        ) : (
                          categoryScores.map((score) => (
                            <tr
                              key={score.id}
                              className="border-t border-white/10"
                            >
                              <td className="px-6 py-5 font-medium">
                                {score.competition?.name ?? "Competition"}
                              </td>

                              <td className="px-6 py-5 text-right font-bold text-[#2463C7]">
                                {score.balagha_points}
                              </td>

                              <td className="px-6 py-5 text-right font-bold text-[#168343]">
                                {score.fasaha_points}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Official FANNUR FIESTA 2K27 Scoreboard
        </p>
      </div>
    </main>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
          Loading leaderboard...
        </div>
      }
    >
      <LeaderboardData />
    </Suspense>
  );
}
