
"use client";

import { useMemo, useState } from "react";
import AddParticipantForm from "./AddParticipantForm";
import { deleteParticipant } from "./actions";
import { useRouter } from "next/navigation";

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

export default function ParticipantsClient({
  participants,
  categories,
  teams,
  error = false,
}: Props) {
    const router = useRouter();
    
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [team, setTeam] = useState("All Teams");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  const filteredParticipants = useMemo(() => {
    return participants.filter((participant) => {
      const matchesSearch =
        participant.full_name.toLowerCase().includes(search.toLowerCase()) ||
        participant.tag_number.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All Categories" ||
        participant.category_name === category;

      const matchesTeam =
        team === "All Teams" || participant.team_name === team;

      return matchesSearch && matchesCategory && matchesTeam;
    });
  }, [participants, search, category, team]);

  const countByTeam = (teamName: string) =>
    participants.filter(
      (participant) =>
        participant.team_name.toUpperCase() === teamName
    ).length;

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <a
          href="/admin/dashboard"
          className="text-sm text-green-400 hover:text-green-300"
        >
          ← Back to Dashboard
        </a>

        <div className="mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold tracking-widest text-green-400">
              ADMIN MANAGEMENT
            </p>
            <h1 className="mt-2 text-4xl font-extrabold">Participants</h1>
            <p className="mt-2 text-gray-400">
              Manage all SAFA Arts Fest participants.
            </p>
          </div>

          <AddParticipantForm
  categories={categories}
  teams={teams}
/>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <StatCard label="Total Participants" value={participants.length} />
          <StatCard
            label="FASAHA"
            value={countByTeam("FASAHA")}
            color="text-green-400"
          />
          <StatCard
            label="BALAGHA"
            value={countByTeam("BALAGHA")}
            color="text-blue-400"
          />
        </div>

        <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or tag number..."
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-green-500"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#171717] px-4 py-3 text-white"
            >
              <option>All Categories</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#171717] px-4 py-3 text-white"
            >
              <option>All Teams</option>
              {teams.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="py-16 text-center text-red-400">
              Could not load participant records. Check Supabase permissions.
            </p>
          ) : (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-sm text-gray-400">
                    <th className="px-4 py-4">TAG NO.</th>
                    <th className="px-4 py-4">PARTICIPANT NAME</th>
                    <th className="px-4 py-4">CATEGORY</th>
                    <th className="px-4 py-4">TEAM</th>
                    <th className="px-4 py-4">ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center text-gray-500">
                        No participants found.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((participant) => (
                      <tr
                        key={participant.id}
                        className="border-b border-white/5 hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-4 font-mono text-green-400">
                          {participant.tag_number || "—"}
                        </td>
                        <td className="px-4 py-4 font-medium">
                          {participant.full_name}
                        </td>
                        <td className="px-4 py-4 text-gray-300">
                          {participant.category_name || "—"}
                        </td>
                        <td className="px-4 py-4 text-gray-300">
                          {participant.team_name || "—"}
                        </td>
                        <td className="px-4 py-4">
  <button
    type="button"
    disabled={deletingId === participant.id}
    onClick={async () => {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${participant.full_name}?`
      );

      if (!confirmed) return;

      setDeletingId(participant.id);
      setDeleteMessage("");

      const result = await deleteParticipant(participant.id);

      setDeleteMessage(result.message);

      if (result.success) {
        router.refresh();
      }

      setDeletingId(null);
    }}
    className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
  >
    {deletingId === participant.id ? "Deleting..." : "Delete"}
  </button>
</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!error && (
            <p className="mt-4 text-sm text-gray-500">
              Showing {filteredParticipants.length} of {participants.length} participants
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-gray-400">{label}</p>
      <h2 className={`mt-3 text-3xl font-bold ${color}`}>{value}</h2>
    </div>
  );
}
