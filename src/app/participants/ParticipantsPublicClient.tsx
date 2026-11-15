"use client";

import { useMemo, useState } from "react";

type Participant = {
  id: string;
  full_name: string;
  tag_number: string;
  category_name: string;
  team_name: string;
};

type Props = {
  participants: Participant[];
  categories: string[];
  teams: string[];
  error?: boolean;
};

export default function ParticipantsPublicClient({
  participants,
  categories,
  teams,
  error = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [team, setTeam] = useState("ALL");

  const filteredParticipants = useMemo(() => {
  const searchText = search.trim().toLowerCase();

  return participants
    .filter((participant) => {
      const matchesSearch =
        participant.full_name.toLowerCase().includes(searchText) ||
        participant.tag_number.toLowerCase().includes(searchText);

      const matchesCategory =
        category === "ALL" ||
        participant.category_name === category;

      const matchesTeam =
        team === "ALL" ||
        participant.team_name === team;

      return matchesSearch && matchesCategory && matchesTeam;
    })
    .sort((a, b) =>
      a.tag_number.localeCompare(b.tag_number, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
}, [participants, search, category, team]);

  const countByTeam = (teamName: string) =>
    participants.filter(
      (participant) =>
        participant.team_name.toUpperCase() === teamName.toUpperCase()
    ).length;

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-5 py-16 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">

        <p className="text-sm font-semibold tracking-[0.3em] text-green-400">
          SAFA ARTS FEST 2K27
        </p>

        <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
          Participants
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-gray-400">
          Explore the participants of SAFA ARTS FEST 2K27.
          Discover their categories, tag numbers and teams.
        </p>

        {/* Statistics */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-400">
              Total Participants
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              {participants.length}
            </h2>
          </div>

          <div className="rounded-xl border border-[#168343]/40 bg-[#168343]/10 p-5">
            <p className="text-sm text-gray-400">FASAHA</p>
            <h2 className="mt-2 text-3xl font-bold text-green-400">
              {countByTeam("FASAHA")}
            </h2>
          </div>

          <div className="rounded-xl border border-[#2463C7]/40 bg-[#2463C7]/10 p-5">
            <p className="text-sm text-gray-400">BALAGHA</p>
            <h2 className="mt-2 text-3xl font-bold text-blue-400">
              {countByTeam("BALAGHA")}
            </h2>
          </div>
        </div>

        {/* Search */}
        <div className="mt-10">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or tag number..."
            className="w-full rounded-xl border border-white/15 bg-white/5 px-5 py-4 text-white outline-none transition focus:border-green-500"
          />
        </div>

        {/* Category filters */}
        <h2 className="mt-10 text-lg font-semibold">
          Categories
        </h2>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setCategory("ALL")}
            className={`rounded-full border px-5 py-2 text-sm transition ${
              category === "ALL"
                ? "border-green-500 bg-green-500 text-white"
                : "border-white/15 hover:border-green-500 hover:bg-green-500/10"
            }`}
          >
            ALL
          </button>

          {categories.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full border px-5 py-2 text-sm transition ${
                category === item
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-white/15 hover:border-green-500 hover:bg-green-500/10"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Team filters */}
        <h2 className="mt-10 text-lg font-semibold">
          Teams
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTeam(team === "FASAHA" ? "ALL" : "FASAHA")}
            className={`rounded-xl border p-6 text-left transition ${
              team === "FASAHA"
                ? "border-[#168343] bg-[#168343]/20"
                : "border-[#168343]/50 bg-[#168343]/10 hover:bg-[#168343]/20"
            }`}
          >
            <h3 className="text-2xl font-bold text-[#168343]">
              FASAHA
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              {countByTeam("FASAHA")} Participants
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTeam(team === "BALAGHA" ? "ALL" : "BALAGHA")}
            className={`rounded-xl border p-6 text-left transition ${
              team === "BALAGHA"
                ? "border-[#2463C7] bg-[#2463C7]/20"
                : "border-[#2463C7]/50 bg-[#2463C7]/10 hover:bg-[#2463C7]/20"
            }`}
          >
            <h3 className="text-2xl font-bold text-[#2463C7]">
              BALAGHA
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              {countByTeam("BALAGHA")} Participants
            </p>
          </button>
        </div>

        {/* Participant list */}
        <div className="mt-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              Participant List
            </h2>

            <p className="text-sm text-gray-400">
              Showing {filteredParticipants.length} of {participants.length}
            </p>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8 text-center">
              <p className="font-semibold text-red-400">
                Could not load participant records.
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Please check the Supabase public read permissions.
              </p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 p-10 text-center">
              <p className="text-lg font-semibold text-gray-300">
                No participants found.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[600px] text-left">
                <thead className="bg-white/5">
                  <tr className="text-xs tracking-wider text-gray-400">
                    <th className="px-5 py-4">TAG NO.</th>
                    <th className="px-5 py-4">PARTICIPANT NAME</th>
                    <th className="px-5 py-4">CATEGORY</th>
                    <th className="px-5 py-4">TEAM</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredParticipants.map((participant) => (
                    <tr
                      key={participant.id}
                      className="border-t border-white/5 transition hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4 font-mono text-green-400">
                        {participant.tag_number || "—"}
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {participant.full_name}
                      </td>

                      <td className="px-5 py-4 text-gray-300">
                        {participant.category_name || "—"}
                      </td>

                      <td
                        className={`px-5 py-4 font-semibold ${
                          participant.team_name.toUpperCase() === "FASAHA"
                            ? "text-green-400"
                            : participant.team_name.toUpperCase() === "BALAGHA"
                              ? "text-blue-400"
                              : "text-gray-300"
                        }`}
                      >
                        {participant.team_name || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}