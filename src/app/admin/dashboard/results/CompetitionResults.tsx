
type Result = {
  id: string;
  position: number | null;
  points: number;
  participant_name: string;
  group_name: string | null;
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

            <div className="divide-y divide-white/5">
              {competition.entries
                .filter((entry) =>
                  [1, 2, 3].includes(entry.position ?? 0)
                )
                .sort((a, b) => a.position! - b.position!)
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-green-400">
                        {entry.position === 1
                          ? "1st"
                          : entry.position === 2
                            ? "2nd"
                            : "3rd"}
                      </span>

                      <span className="font-medium text-white">
                        {entry.participant_name || entry.group_name}
                      </span>
                    </div>

                    <span className="font-bold text-white">
                      {entry.points} Points
                    </span>
                  </div>
                ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
