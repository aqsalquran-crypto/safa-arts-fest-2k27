
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type Member = {
  id: string;
  full_name: string;
  tag_number: string;
};

type Team = {
  id: string;
  name: string;
  color: string;
  logo_url: string | null;
  introduction: string;
  manager_id: string | null;
  captain_id: string | null;
  vice_captain_id: string | null;
  manager_name: string;
  captain_name: string;
  vice_captain_name: string;
  members: Member[];
};

type Props = {
  teams: Team[];
  error?: boolean;
};

type LeadershipDraft = {
  manager_id: string;
  captain_id: string;
  vice_captain_id: string;
};

export default function TeamsClient({
  teams,
  error = false,
}: Props) {
  const [teamList, setTeamList] = useState(teams);
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("All Teams");

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  const [draft, setDraft] = useState<LeadershipDraft>({
    manager_id: "",
    captain_id: "",
    vice_captain_id: "",
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");

  const editingTeam = teamList.find(
    (team) => team.id === editingTeamId
  );

  const filteredMembers = useMemo(() => {
    return teamList
      .filter(
        (team) =>
          selectedTeam === "All Teams" ||
          team.id === selectedTeam
      )
      .flatMap((team) =>
        team.members
          .filter(
            (member) =>
              member.full_name
                .toLowerCase()
                .includes(search.toLowerCase()) ||
              member.tag_number
                .toLowerCase()
                .includes(search.toLowerCase())
          )
          .map((member) => ({
            ...member,
            teamName: team.name,
            teamColor: team.color,
          }))
      );
  }, [teamList, search, selectedTeam]);

  const totalMembers = teamList.reduce(
    (total, team) => total + team.members.length,
    0
  );

  function openManage(team: Team) {
    setEditingTeamId(team.id);

    setDraft({
      manager_id: team.manager_id ?? "",
      captain_id: team.captain_id ?? "",
      vice_captain_id: team.vice_captain_id ?? "",
    });

    setSaveError("");
    setNotice("");
  }

  function closeManage() {
    if (saving) return;

    setEditingTeamId(null);
    setSaveError("");
  }

  async function saveLeadership() {
    if (!editingTeam) return;

    setSaving(true);
    setSaveError("");

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error: updateError } = await supabase
        .from("teams")
        .update({
          manager_id: draft.manager_id || null,
          captain_id: draft.captain_id || null,
          vice_captain_id: draft.vice_captain_id || null,
        })
        .eq("id", editingTeam.id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      if (!data) {
        throw new Error(
          "No team was updated. Check your admin permissions and RLS policies."
        );
      }

      const updatedTeam = editingTeam;

      setTeamList((previousTeams) =>
        previousTeams.map((team) => {
          if (team.id !== updatedTeam.id) return team;

          const getName = (id: string) =>
            team.members.find((member) => member.id === id)
              ?.full_name ?? "";

          return {
            ...team,
            manager_id: draft.manager_id || null,
            captain_id: draft.captain_id || null,
            vice_captain_id: draft.vice_captain_id || null,
            manager_name: getName(draft.manager_id),
            captain_name: getName(draft.captain_id),
            vice_captain_name: getName(draft.vice_captain_id),
          };
        })
      );

      setNotice(`${updatedTeam.name} leadership saved successfully.`);
      setEditingTeamId(null);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin/dashboard"
          className="text-sm text-green-400 hover:text-green-300"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold tracking-widest text-green-400">
            ADMIN MANAGEMENT
          </p>

          <h1 className="mt-2 text-4xl font-extrabold">
            Team Management
          </h1>

          <p className="mt-2 text-gray-400">
            Manage teams, leadership and team members.
          </p>
        </div>

        {notice && (
          <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
            {notice}
          </div>
        )}

        {error ? (
          <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-400">
            Could not load team information.
            Please check Supabase permissions.
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              <StatCard
                label="Total Teams"
                value={teamList.length}
              />

              <StatCard
                label="Total Members"
                value={totalMembers}
              />

              <StatCard
                label="Unassigned Members"
                value="—"
              />
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {teamList.map((team) => (
                <div
                  key={team.id}
                  className="rounded-2xl border bg-white/5 p-7"
                  style={{
                    borderColor: `${team.color}88`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2
                        className="text-3xl font-extrabold"
                        style={{ color: team.color }}
                      >
                        {team.name}
                      </h2>

                      <p className="mt-2 text-sm text-gray-400">
                        {team.introduction ||
                          (team.name === "FASAHA"
                            ? "The Green Team"
                            : "The Blue Team")}
                      </p>
                    </div>

                    <div
                      className="h-12 w-12 rounded-full"
                      style={{
                        backgroundColor: team.color,
                      }}
                    />
                  </div>

                  <div className="mt-8 space-y-4">
                    {[
                      {
                        role: "Team Manager",
                        name: team.manager_name,
                      },
                      {
                        role: "Captain",
                        name: team.captain_name,
                      },
                      {
                        role: "Vice-Captain",
                        name: team.vice_captain_name,
                      },
                    ].map((item) => (
                      <div
                        key={item.role}
                        className="rounded-lg border border-white/10 bg-black/30 p-4"
                      >
                        <p className="text-xs text-gray-500">
                          {item.role}
                        </p>

                        <p className="mt-1 text-gray-300">
                          {item.name || "Not assigned yet"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-xs text-gray-400">
                        Members
                      </p>

                      <p className="mt-2 text-2xl font-bold">
                        {team.members.length}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-xs text-gray-400">
                        Total Points
                      </p>

                      <p className="mt-2 text-2xl font-bold">
                        —
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openManage(team)}
                    className="mt-6 w-full rounded-lg bg-white py-3 font-semibold text-black transition hover:bg-gray-200"
                  >
                    Manage {team.name}
                  </button>
                </div>
              ))}
            </div>

            <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-7">
              <h2 className="text-2xl font-bold">
                Team Members
              </h2>

              <p className="mt-2 text-sm text-gray-400">
                View participants assigned to each team.
              </p>

              <div className="mt-6 flex flex-col gap-4 md:flex-row">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or tag number..."
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-green-500"
                />

                <select
                  value={selectedTeam}
                  onChange={(e) =>
                    setSelectedTeam(e.target.value)
                  }
                  className="rounded-lg border border-white/10 bg-[#171717] px-4 py-3 text-white"
                >
                  <option value="All Teams">All Teams</option>

                  {teamList.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-sm text-gray-400">
                      <th className="px-4 py-4">NAME</th>
                      <th className="px-4 py-4">TAG NUMBER</th>
                      <th className="px-4 py-4">TEAM</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-12 text-center text-gray-500"
                        >
                          No team members found.
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => (
                        <tr
                          key={member.id}
                          className="border-b border-white/5"
                        >
                          <td className="px-4 py-4 font-medium">
                            {member.full_name}
                          </td>

                          <td className="px-4 py-4 text-gray-400">
                            {member.tag_number}
                          </td>

                          <td
                            className="px-4 py-4 font-semibold"
                            style={{
                              color: member.teamColor,
                            }}
                          >
                            {member.teamName}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-sm text-gray-500">
                Showing {filteredMembers.length} members
              </p>
            </section>
          </>
        )}
      </div>

      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#171717] p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest text-green-400">
                  TEAM SETTINGS
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Manage {editingTeam.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeManage}
                disabled={saving}
                className="text-2xl text-gray-400 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-400">
              Select the leaders from this team's registered participants.
            </p>

            <div className="mt-7 space-y-5">
              {[
                {
                  label: "Team Manager",
                  field: "manager_id" as const,
                },
                {
                  label: "Captain",
                  field: "captain_id" as const,
                },
                {
                  label: "Vice-Captain",
                  field: "vice_captain_id" as const,
                },
              ].map((item) => (
                <div key={item.field}>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    {item.label}
                  </label>

                  <select
                    value={draft[item.field]}
                    onChange={(e) =>
                      setDraft((previous) => ({
                        ...previous,
                        [item.field]: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#0b0b0b] px-4 py-3 text-white outline-none focus:border-green-500"
                  >
                    <option value="">
                      Not assigned
                    </option>

                    {editingTeam.members.map((member) => (
                      <option
                        key={member.id}
                        value={member.id}
                      >
                        {member.full_name} — {member.tag_number}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {editingTeam.members.length === 0 && (
              <p className="mt-4 text-sm text-yellow-400">
                No participants are currently assigned to this team.
              </p>
            )}

            {saveError && (
              <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {saveError}
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={closeManage}
                disabled={saving}
                className="flex-1 rounded-lg border border-white/15 py-3 font-semibold text-gray-300 hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveLeadership}
                disabled={saving}
                className="flex-1 rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-gray-400">{label}</p>

      <h2 className="mt-3 text-3xl font-bold">
        {value}
      </h2>
    </div>
  );
}
