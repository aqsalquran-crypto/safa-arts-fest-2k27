"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  registerParticipant,
  removeRegistration,
} from "./actions";

type Participant = {
  id: string;
  full_name: string;
  tag_number: string;
  category_id: string;
  category_name: string;
  team_name: string;
};

type Competition = {
  id: string;
  name: string;
  competition_type: string;
  status: string;
  eligible_category_ids: string[];
};

type Registration = {
  id: string;
  competition_id: string;
  participant_id: string;
};

type Props = {
  participants: Participant[];
  competitions: Competition[];
  registrations: Registration[];
  categories: { id: string; name: string }[];
  error?: boolean;
};

export default function RegistrationsClient({
  participants,
  competitions,
  registrations,
  categories,
  error = false,
}: Props) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [team, setTeam] = useState("All Teams");
  const [participantId, setParticipantId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);

  const selectedParticipant = participants.find(
    (item) => item.id === participantId
  );

  const filteredParticipants = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return participants.filter((item) => {
      const matchesSearch =
        item.full_name.toLowerCase().includes(searchValue) ||
        item.tag_number.toLowerCase().includes(searchValue);

      const matchesCategory =
        category === "All Categories" ||
        item.category_name === category;

      const matchesTeam =
        team === "All Teams" || item.team_name === team;

      return matchesSearch && matchesCategory && matchesTeam;
    });
  }, [participants, search, category, team]);

  const eligibleCompetitions = useMemo(() => {
    if (!selectedParticipant?.category_id) return [];

    return competitions.filter((competition) =>
      competition.eligible_category_ids.includes(
        selectedParticipant.category_id
      )
    );
  }, [competitions, selectedParticipant]);

  const registeredForParticipant = registrations.filter(
    (item) => item.participant_id === participantId
  );

  const registeredIds = new Set(
    registeredForParticipant.map((item) => item.competition_id)
  );

  const availableCompetitions = eligibleCompetitions.filter(
    (item) => !registeredIds.has(item.id)
  );

  const totalRegistered = registrations.length;

  const teams = Array.from(
    new Set(
      participants
        .map((item) => item.team_name)
        .filter(Boolean)
    )
  );

  function toggleCompetition(id: string) {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  function selectParticipant(id: string) {
    setParticipantId(id);
    setSelectedIds([]);
    setMessage("");
  }

  async function handleRegister() {
    if (!participantId || selectedIds.length === 0) {
      setMessage("Please select a participant and competitions.");
      setMessageError(true);
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const result = await registerParticipant(
        participantId,
        selectedIds
      );

      setMessage(result.message);
      setMessageError(!result.success);

      if (result.success) {
        setSelectedIds([]);
        router.refresh();
      }
    } catch (err) {
      console.error("Registration error:", err);
      setMessage("Something went wrong. Please try again.");
      setMessageError(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(registrationId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this competition registration?"
    );

    if (!confirmed) return;

    setRemovingId(registrationId);
    setMessage("");

    try {
      const result = await removeRegistration(registrationId);

      setMessage(result.message);
      setMessageError(!result.success);

      if (result.success) {
        router.refresh();
      }
    } catch (err) {
      console.error("Remove registration error:", err);
      setMessage("Could not remove registration.");
      setMessageError(true);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <a
          href="/admin/dashboard"
          className="text-sm text-green-400 hover:text-green-300"
        >
          ← Back to Dashboard
        </a>

        <div className="mt-8">
          <p className="text-sm font-semibold tracking-widest text-green-400">
            ADMIN MANAGEMENT
          </p>

          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            Competition Registration
          </h1>

          <p className="mt-2 text-gray-400">
            Register participants for eligible festival competitions.
          </p>
        </div>

        {/* STATISTICS */}

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <StatCard
            label="Total Participants"
            value={participants.length}
          />

          <StatCard
            label="Total Competitions"
            value={competitions.length}
          />

          <StatCard
            label="Total Registrations"
            value={totalRegistered}
            color="text-green-400"
          />
        </div>

        {error ? (
          <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-400">
            Could not load registration data. Please check Supabase permissions and database tables.
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              {/* PARTICIPANT SELECTION */}

              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-xl font-bold">
                  01. Select Participant
                </h2>

                <p className="mt-2 text-sm text-gray-400">
                  Search and select a participant.
                </p>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or tag number..."
                  className="mt-6 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-green-500"
                />

                {/* FILTERS */}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="min-w-0 rounded-lg border border-white/10 bg-[#171717] px-3 py-3 text-sm"
                  >
                    <option value="All Categories">
                      All Categories
                    </option>

                    {categories.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className="min-w-0 rounded-lg border border-white/10 bg-[#171717] px-3 py-3 text-sm"
                  >
                    <option value="All Teams">All Teams</option>

                    {teams.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PARTICIPANT LIST */}

                <div className="mt-5 max-h-[430px] space-y-2 overflow-y-auto">
                  {filteredParticipants.length === 0 ? (
                    <p className="py-10 text-center text-gray-500">
                      No participants found.
                    </p>
                  ) : (
                    filteredParticipants.map((participant) => (
                      <button
                        type="button"
                        key={participant.id}
                        onClick={() =>
                          selectParticipant(participant.id)
                        }
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          participantId === participant.id
                            ? "border-green-500 bg-green-500/10"
                            : "border-white/10 bg-white/[0.02] hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">
                              {participant.full_name}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              Tag: {participant.tag_number || "—"}
                              {" · "}
                              {participant.category_name || "No category"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {participant.team_name || "No team"}
                            </p>
                          </div>

                          {participantId === participant.id && (
                            <span className="text-green-400">✓</span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  Showing {filteredParticipants.length} of{" "}
                  {participants.length} participants
                </p>
              </section>

              {/* COMPETITION SELECTION */}

              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-xl font-bold">
                  02. Select Competitions
                </h2>

                <p className="mt-2 text-sm text-gray-400">
                  Only competitions available for the selected participant's category are shown.
                </p>

                {!selectedParticipant ? (
                  <div className="mt-8 rounded-xl border border-dashed border-white/20 p-10 text-center">
                    <p className="text-3xl">👤</p>

                    <p className="mt-3 font-semibold">
                      No participant selected
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      Select a participant to see available competitions.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/[0.07] p-4">
                      <p className="font-semibold">
                        {selectedParticipant.full_name}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {selectedParticipant.category_name || "No category"}
                        {" · "}
                        {selectedParticipant.team_name || "No team"}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-300">
                        Available Competitions
                      </p>

                      <span className="text-xs text-gray-500">
                        {availableCompetitions.length} available
                      </span>
                    </div>

                    <div className="mt-3 max-h-[330px] space-y-2 overflow-y-auto">
                      {eligibleCompetitions.length === 0 ? (
                        <p className="py-12 text-center text-gray-500">
                          No competitions are linked to this category.
                        </p>
                      ) : availableCompetitions.length === 0 ? (
                        <p className="py-12 text-center text-green-400">
                          All eligible competitions have been registered.
                        </p>
                      ) : (
                        availableCompetitions.map((competition) => (
                          <label
                            key={competition.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                              selectedIds.includes(competition.id)
                                ? "border-green-500 bg-green-500/10"
                                : "border-white/10 hover:border-white/30"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(
                                competition.id
                              )}
                              onChange={() =>
                                toggleCompetition(competition.id)
                              }
                              className="h-5 w-5 accent-green-500"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">
                                {competition.name}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                {competition.competition_type || "Competition"}
                                {" · "}
                                {competition.status || "No status"}
                              </p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>

                    {/* REGISTER BUTTON */}

                    <div className="mt-5 rounded-xl bg-black/30 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          Selected competitions
                        </span>

                        <span className="font-bold text-green-400">
                          {selectedIds.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleRegister}
                        disabled={
                          submitting || selectedIds.length === 0
                        }
                        className="mt-4 w-full rounded-lg bg-green-500 px-5 py-3 font-bold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {submitting
                          ? "Registering..."
                          : `Register ${selectedIds.length} Competition${selectedIds.length === 1 ? "" : "s"}`}
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>

            {/* EXISTING REGISTRATIONS */}

            <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-xl font-bold">
                03. Existing Registrations
              </h2>

              <p className="mt-2 text-sm text-gray-400">
                View and manage competition registrations.
              </p>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-gray-400">
                      <th className="px-3 py-4">TAG</th>
                      <th className="px-3 py-4">PARTICIPANT</th>
                      <th className="px-3 py-4">COMPETITION</th>
                      <th className="px-3 py-4">CATEGORY</th>
                      <th className="px-3 py-4">ACTION</th>
                    </tr>
                  </thead>

                  <tbody>
                    {registrations.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-16 text-center text-gray-500"
                        >
                          No participants are registered for any competition yet.
                        </td>
                      </tr>
                    ) : (
                      registrations.map((registration) => {
                        const participant = participants.find(
                          (item) =>
                            item.id === registration.participant_id
                        );

                        const competition = competitions.find(
                          (item) =>
                            item.id === registration.competition_id
                        );

                        if (!participant || !competition) return null;

                        return (
                          <tr
                            key={registration.id}
                            className="border-b border-white/5"
                          >
                            <td className="px-3 py-4 font-mono text-green-400">
                              {participant.tag_number || "—"}
                            </td>

                            <td className="px-3 py-4 font-medium">
                              {participant.full_name}
                            </td>

                            <td className="px-3 py-4 text-gray-300">
                              {competition.name}
                            </td>

                            <td className="px-3 py-4 text-gray-400">
                              {participant.category_name}
                            </td>

                            <td className="px-3 py-4">
                              <button
                                type="button"
                                disabled={removingId !== null}
                                onClick={() =>
                                  handleRemove(registration.id)
                                }
                                className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                              >
                                {removingId === registration.id
                                  ? "Removing..."
                                  : "Remove"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {message && (
          <div
            className={`mt-6 rounded-xl border p-4 text-sm ${
              messageError
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-green-500/30 bg-green-500/10 text-green-400"
            }`}
          >
            {message}
          </div>
        )}
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
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6">
      <p className="text-sm text-gray-400">{label}</p>

      <h2 className={`mt-3 text-3xl font-bold ${color}`}>
        {value}
      </h2>
    </div>
  );
}