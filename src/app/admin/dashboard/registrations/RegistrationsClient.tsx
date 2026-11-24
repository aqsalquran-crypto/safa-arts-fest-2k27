
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  registerParticipant,
  removeRegistration,
  registerGroup,
  removeGroup,
} from "./actions";

type Participant = {
  id: string;
  full_name: string;
  tag_number: string;
  category_id: string;
  category_name: string;
  team_id: string | null;
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

type Team = {
  id: string;
  name: string;
};

type Group = {
  id: string;
  competition_id: string;
  team_id: string;
  group_name: string;
  participant_ids: string[];
};

type Category = {
  id: string;
  name: string;
};

type Props = {
  participants: Participant[];
  competitions: Competition[];
  registrations: Registration[];
  categories: Category[];
  teams: Team[];
  groups: Group[];
  error?: boolean;
};

const MAIN_CATEGORIES = ["BIDAYA", "THANAVIYYA", "ALIYA"];

export default function RegistrationsClient({
  participants = [],
  competitions = [],
  registrations = [],
  categories = [],
  teams = [],
  groups = [],
  error = false,
}: Props) {
  const router = useRouter();

  // --------------------------------------------------
  // KULLIYYA ELIGIBILITY
  // --------------------------------------------------

  const kulliyyaCategoryId = categories.find(
    (item) => item.name.trim().toUpperCase() === "KULLIYYA"
  )?.id;

  function isEligibleForCompetition(
    competition: Competition | undefined,
    participant: Participant
  ) {
    if (!competition) return false;

    const eligibleIds = competition.eligible_category_ids || [];

    // Participant's own category is eligible.
    if (eligibleIds.includes(participant.category_id)) {
      return true;
    }

    // KULLIYYA competitions are also open to the three main categories.
    const participantCategory = (
      participant.category_name || ""
    ).trim().toUpperCase();

    const isMainCategory = MAIN_CATEGORIES.includes(
      participantCategory
    );

    const isKulliyyaCompetition =
      !!kulliyyaCategoryId &&
      eligibleIds.includes(kulliyyaCategoryId);

    return isMainCategory && isKulliyyaCompetition;
  }

  // --------------------------------------------------
  // INDIVIDUAL REGISTRATION STATE
  // --------------------------------------------------

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [teamId, setTeamId] = useState("All Teams");
  const [participantId, setParticipantId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // --------------------------------------------------
  // GROUP REGISTRATION STATE
  // --------------------------------------------------

  const [groupCompetitionId, setGroupCompetitionId] = useState("");
  const [groupTeamId, setGroupTeamId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupParticipantIds, setGroupParticipantIds] = useState<string[]>([]);

  // --------------------------------------------------
  // UI STATE
  // --------------------------------------------------

  const [submitting, setSubmitting] = useState(false);
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removingGroupId, setRemovingGroupId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);

  const selectedParticipant = participants.find(
    (item) => item.id === participantId
  );

  // --------------------------------------------------
  // FILTER PARTICIPANTS
  // --------------------------------------------------

  const filteredParticipants = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return participants.filter((item) => {
      const matchesSearch =
        (item.full_name || "").toLowerCase().includes(searchValue) ||
        (item.tag_number || "").toLowerCase().includes(searchValue);

      const matchesCategory =
        category === "All Categories" ||
        item.category_name === category;

      const matchesTeam =
        teamId === "All Teams" || item.team_id === teamId;

      return matchesSearch && matchesCategory && matchesTeam;
    });
  }, [participants, search, category, teamId]);

  // --------------------------------------------------
  // ELIGIBLE INDIVIDUAL COMPETITIONS
  // --------------------------------------------------

  const eligibleCompetitions = useMemo(() => {
    if (!selectedParticipant?.category_id) return [];

    return competitions.filter(
      (competition) =>
        competition.competition_type === "INDIVIDUAL" &&
        isEligibleForCompetition(competition, selectedParticipant)
    );
  }, [competitions, selectedParticipant, kulliyyaCategoryId]);

  const registeredForParticipant = registrations.filter(
    (item) => item.participant_id === participantId
  );

  const registeredIds = new Set(
    registeredForParticipant.map((item) => item.competition_id)
  );

  const availableCompetitions = eligibleCompetitions.filter(
    (item) => !registeredIds.has(item.id)
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

  // --------------------------------------------------
  // REGISTER INDIVIDUAL PARTICIPANT
  // --------------------------------------------------

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
      setMessage("Something went wrong while registering.");
      setMessageError(true);
    } finally {
      setSubmitting(false);
    }
  }

  // --------------------------------------------------
  // REMOVE INDIVIDUAL REGISTRATION
  // --------------------------------------------------

  async function handleRemove(registrationId: string) {
    if (
      !window.confirm(
        "Are you sure you want to remove this competition registration?"
      )
    ) {
      return;
    }

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

  // --------------------------------------------------
  // GROUP REGISTRATION
  // --------------------------------------------------

  const groupCompetitions = competitions.filter(
    (competition) => competition.competition_type === "GROUP"
  );

  const groupTeamParticipants = participants.filter(
    (participant) => participant.team_id === groupTeamId
  );

  const selectedGroupCompetition = groupCompetitions.find(
    (competition) => competition.id === groupCompetitionId
  );

  // KULLIYYA eligibility also applies to group participants.
  const eligibleGroupParticipants = groupTeamParticipants.filter(
    (participant) =>
      isEligibleForCompetition(
        selectedGroupCompetition,
        participant
      ) &&
      !groups.some(
        (group) =>
          group.competition_id === groupCompetitionId &&
          group.participant_ids.includes(participant.id)
      )
  );

  function toggleGroupParticipant(id: string) {
    setGroupParticipantIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  function resetGroupForm() {
    setGroupCompetitionId("");
    setGroupTeamId("");
    setGroupName("");
    setGroupParticipantIds([]);
  }

  // --------------------------------------------------
  // REGISTER GROUP
  // --------------------------------------------------

  async function handleGroupRegister() {
    if (
      !groupCompetitionId ||
      !groupTeamId ||
      !groupName.trim() ||
      groupParticipantIds.length === 0
    ) {
      setMessage("Please complete all group registration fields.");
      setMessageError(true);
      return;
    }

    setGroupSubmitting(true);
    setMessage("");

    try {
      const result = await registerGroup(
        groupCompetitionId,
        groupTeamId,
        groupName,
        groupParticipantIds
      );

      setMessage(result.message);
      setMessageError(!result.success);

      if (result.success) {
        resetGroupForm();
        router.refresh();
      }
    } catch (err) {
      console.error("Group registration error:", err);
      setMessage("Something went wrong while registering the group.");
      setMessageError(true);
    } finally {
      setGroupSubmitting(false);
    }
  }

  // --------------------------------------------------
  // REMOVE GROUP
  // --------------------------------------------------

  async function handleRemoveGroup(groupId: string) {
    if (
      !window.confirm(
        "Are you sure you want to remove this group registration?"
      )
    ) {
      return;
    }

    setRemovingGroupId(groupId);
    setMessage("");

    try {
      const result = await removeGroup(groupId);

      setMessage(result.message);
      setMessageError(!result.success);

      if (result.success) {
        router.refresh();
      }
    } catch (err) {
      console.error("Remove group error:", err);
      setMessage("Could not remove group.");
      setMessageError(true);
    } finally {
      setRemovingGroupId(null);
    }
  }

  // --------------------------------------------------
  // GROUP INDIVIDUAL REGISTRATIONS BY PARTICIPANT
  // --------------------------------------------------

  const groupedIndividualRegistrations = useMemo(() => {
    const grouped = new Map<
      string,
      {
        participant: Participant;
        competitions: {
          registrationId: string;
          competition: Competition;
        }[];
      }
    >();

    registrations.forEach((registration) => {
      const participant = participants.find(
        (item) => item.id === registration.participant_id
      );

      const competition = competitions.find(
        (item) => item.id === registration.competition_id
      );

      if (!participant || !competition) return;

      if (!grouped.has(participant.id)) {
        grouped.set(participant.id, {
          participant,
          competitions: [],
        });
      }

      grouped.get(participant.id)!.competitions.push({
        registrationId: registration.id,
        competition,
      });
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.participant.full_name.localeCompare(
        b.participant.full_name
      )
    );
  }, [registrations, participants, competitions]);

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const totalRegistered = registrations.length;
  const totalGroups = groups.length;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

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
            Manage individual and group competition registrations.
          </p>
        </div>

        {/* STATISTICS */}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Participants" value={participants.length} />
          <StatCard label="Total Competitions" value={competitions.length} />
          <StatCard
            label="Individual Registrations"
            value={totalRegistered}
            color="text-green-400"
          />
          <StatCard
            label="Group Registrations"
            value={totalGroups}
            color="text-blue-400"
          />
        </div>

        {error ? (
          <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-400">
            Could not load registration data. Please check Supabase permissions and database tables.
          </div>
        ) : (
          <>
            {/* INDIVIDUAL REGISTRATION */}

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
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="min-w-0 rounded-lg border border-white/10 bg-[#171717] px-3 py-3 text-sm"
                  >
                    <option value="All Teams">All Teams</option>

                    {teams.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

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
                        onClick={() => selectParticipant(participant.id)}
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
                  Eligible individual competitions for the selected participant are shown here, including KULLIYYA competitions.
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
                          No individual competitions are linked to this category.
                        </p>
                      ) : availableCompetitions.length === 0 ? (
                        <p className="py-12 text-center text-green-400">
                          All eligible individual competitions have been registered.
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
                              checked={selectedIds.includes(competition.id)}
                              onChange={() => toggleCompetition(competition.id)}
                              className="h-5 w-5 accent-green-500"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">
                                {competition.name}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                {competition.competition_type}
                                {" · "}
                                {competition.status || "No status"}
                                {kulliyyaCategoryId &&
                                  competition.eligible_category_ids?.includes(
                                    kulliyyaCategoryId
                                  ) && (
                                    <span className="ml-2 text-green-400">
                                      KULLIYYA
                                    </span>
                                  )}
                              </p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>

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
                        disabled={submitting || selectedIds.length === 0}
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

            {/* GROUP REGISTRATION */}

            <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-xl font-bold">
                03. Group Registration
              </h2>

              <p className="mt-2 text-sm text-gray-400">
                Register a team group for an eligible group competition.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Competition
                  </label>

                  <select
                    value={groupCompetitionId}
                    onChange={(e) => {
                      setGroupCompetitionId(e.target.value);
                      setGroupParticipantIds([]);
                    }}
                    className="w-full rounded-lg border border-white/10 bg-[#171717] px-3 py-3 text-sm"
                  >
                    <option value="">Choose competition</option>

                    {groupCompetitions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Team
                  </label>

                  <select
                    value={groupTeamId}
                    onChange={(e) => {
                      setGroupTeamId(e.target.value);
                      setGroupParticipantIds([]);
                    }}
                    className="w-full rounded-lg border border-white/10 bg-[#171717] px-3 py-3 text-sm"
                  >
                    <option value="">Choose team</option>

                    {teams.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Group Name
                  </label>

                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    maxLength={100}
                    placeholder="Enter group name"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Select Group Members</p>

                  <span className="text-xs text-gray-400">
                    {groupParticipantIds.length} selected
                  </span>
                </div>

                {!groupCompetitionId || !groupTeamId ? (
                  <p className="mt-4 rounded-xl border border-dashed border-white/20 p-8 text-center text-gray-500">
                    Select a competition and team to see eligible participants.
                  </p>
                ) : eligibleGroupParticipants.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-white/20 p-8 text-center text-gray-500">
                    No eligible participants available for this group.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {eligibleGroupParticipants.map((participant) => (
                      <label
                        key={participant.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                          groupParticipantIds.includes(participant.id)
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-white/10"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={groupParticipantIds.includes(participant.id)}
                          onChange={() =>
                            toggleGroupParticipant(participant.id)
                          }
                          className="h-4 w-4 accent-blue-500"
                        />

                        <span className="text-sm">
                          {participant.full_name}
                          <span className="block text-xs text-gray-500">
                            {participant.tag_number}
                            {" · "}
                            {participant.category_name}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleGroupRegister}
                disabled={
                  groupSubmitting ||
                  !groupCompetitionId ||
                  !groupTeamId ||
                  !groupName.trim() ||
                  groupParticipantIds.length === 0
                }
                className="mt-6 w-full rounded-lg bg-blue-500 px-5 py-3 font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {groupSubmitting ? "Registering Group..." : "Register Group"}
              </button>
            </section>

            {/* EXISTING INDIVIDUAL REGISTRATIONS */}

            <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">
                    04. Existing Individual Registrations
                  </h2>

                  <p className="mt-2 text-sm text-gray-400">
                    View and manage registrations participant-wise.
                  </p>
                </div>

                <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-2">
                  <p className="text-xs text-gray-400">
                    Registered Participants
                  </p>

                  <p className="text-xl font-bold text-green-400">
                    {groupedIndividualRegistrations.length}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {groupedIndividualRegistrations.length === 0 ? (
                  <div className="py-16 text-center text-gray-500">
                    No individual registrations yet.
                  </div>
                ) : (
                  groupedIndividualRegistrations.map((item) => (
                    <div
                      key={item.participant.id}
                      className="overflow-hidden rounded-xl border border-white/10 bg-black/30"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] p-4">
                        <div>
                          <h3 className="font-bold text-white">
                            {item.participant.full_name}
                          </h3>

                          <p className="mt-1 text-xs text-gray-400">
                            TAG: {item.participant.tag_number || "—"}
                            {" · "}
                            {item.participant.category_name || "No category"}
                            {" · "}
                            {item.participant.team_name || "No team"}
                          </p>
                        </div>

                        <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                          {item.competitions.length} Competitions
                        </span>
                      </div>

                      <div className="p-4">
                        <p className="mb-3 text-xs font-semibold tracking-wider text-gray-500">
                          REGISTERED COMPETITIONS
                        </p>

                        <div className="space-y-2">
                          {item.competitions.map((entry) => (
                            <div
                              key={entry.registrationId}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="text-green-400">✓</span>

                                <span className="text-sm font-medium text-gray-200">
                                  {entry.competition.name}
                                </span>
                              </div>

                              <button
                                type="button"
                                disabled={removingId !== null}
                                onClick={() =>
                                  handleRemove(entry.registrationId)
                                }
                                className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                              >
                                {removingId === entry.registrationId
                                  ? "Removing..."
                                  : "Remove"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* EXISTING GROUPS */}

            <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-xl font-bold">
                05. Existing Groups
              </h2>

              <div className="mt-6 space-y-3">
                {groups.length === 0 ? (
                  <p className="py-10 text-center text-gray-500">
                    No groups registered yet.
                  </p>
                ) : (
                  groups.map((group) => {
                    const competition = competitions.find(
                      (item) => item.id === group.competition_id
                    );

                    const team = teams.find(
                      (item) => item.id === group.team_id
                    );

                    const members = participants.filter(
                      (item) => group.participant_ids.includes(item.id)
                    );

                    return (
                      <div
                        key={group.id}
                        className="rounded-xl border border-white/10 bg-black/30 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="font-bold">{group.group_name}</p>

                            <p className="mt-1 text-xs text-gray-400">
                              {competition?.name || "Unknown competition"}
                              {" · "}
                              {team?.name || "Unknown team"}
                            </p>

                            <p className="mt-2 text-sm text-gray-300">
                              {members
                                .map((member) => member.full_name)
                                .join(", ")}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={removingGroupId !== null}
                            onClick={() => handleRemoveGroup(group.id)}
                            className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {removingGroupId === group.id
                              ? "Removing..."
                              : "Remove Group"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}

        {/* SUCCESS / ERROR MESSAGE */}

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

// --------------------------------------------------
// STAT CARD
// --------------------------------------------------

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
