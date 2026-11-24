type Result = {
  id: string;
  position: number | null;
  points: number;
  participant_name: string | null;
  group_name: string | null;
  team_name: string | null;
};

type CompetitionResult = {
  id: string;
  competition_name: string;
  entries: Result[];
};

export default function CompetitionResults({
  competitions,
}: {
  competitions: CompetitionResult[];
}) {
  return (
    <div className="mt-8 space-y-8">
      {competitions.length === 0 ? (
        <p className="py-12 text-center text-gray-500">
          No published results yet.
        </p>
      ) : (
        competitions.map((competition) => (
          <section
            key={competition.id}
            className="overflow-hidden rounded-xl border border-white/10 bg-[#151515]"
          >
            <h3 className="border-b border-white/10 px-5 py-4 text-lg font-bold text-green-400">
              {competition.competition_name}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[550px] text-left">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr className="text-sm text-gray-400">
                    <th className="px-5 py-3">Position</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Team Name</th>
                    <th className="px-5 py-3 text-right">Points</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {competition.entries
                    .filter((entry) =>
                      [1, 2, 3].includes(entry.position ?? 0)
                    )
                    .sort(
                      (a, b) =>
                        (a.position ?? 0) - (b.position ?? 0)
                    )
                    .map((entry) => (
                      <tr key={entry.id} className="text-white">
                        <td className="px-5 py-4 font-bold text-green-400">
                          {entry.position === 1
                            ? "1st"
                            : entry.position === 2
                              ? "2nd"
                              : "3rd"}
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {entry.participant_name ||
                            entry.group_name ||
                            "Unknown"}
                        </td>

                        <td className="px-5 py-4 text-gray-300">
                          {entry.team_name || "-"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-bold">
                          {entry.points}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}