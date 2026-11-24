
"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Competition = {
  id: string;
  name: string;
  competition_type: "INDIVIDUAL" | "GROUP";
  competition_section: string;
  category_ids: string[];
  category_names: string[];
};

type Participant = {
  id: string;
  full_name: string;
  tag_number: string;
  category_id: string;
  competition_id: string;
};

type CompetitionGroup = {
  id: string;
  group_name: string;
  competition_id: string;
};

type Props = {
  competitions: Competition[];
  participants: Participant[];
  groups: CompetitionGroup[];
};

type PodiumEntry = {
  targetId: string;
  grade: string;
  points: string;
};

const competitionSections = [
  { value: "STAGE", label: "STAGE" },
  { value: "OFF_STAGE", label: "OFF STAGE" },
  { value: "SPORTS", label: "SPORTS" },
];

const initialPodium: PodiumEntry[] = [
  { targetId: "", grade: "", points: "10" },
  { targetId: "", grade: "", points: "8" },
  { targetId: "", grade: "", points: "6" },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const item = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    const parts = [
      item.message,
      item.details,
      item.hint,
      item.code ? `Code: ${item.code}` : undefined,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" | ");
    }

    return JSON.stringify(error);
  }

  return String(error);
}

export default function ScoreEntry({
  competitions,
  participants,
  groups,
}: Props) {
  const [competitionId, setCompetitionId] = useState("");
  const [podium, setPodium] = useState<PodiumEntry[]>(
    initialPodium.map((item) => ({ ...item }))
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const competition = competitions.find(
    (item) => item.id === competitionId
  );

  const availableParticipants = useMemo(() => {
    if (!competition) return [];

    return participants.filter(
      (participant) =>
        participant.competition_id === competition.id
    );
  }, [participants, competition]);

  const availableGroups = useMemo(
    () =>
      groups.filter(
        (group) => group.competition_id === competitionId
      ),
    [groups, competitionId]
  );

  function updatePodium(
    index: number,
    field: keyof PodiumEntry,
    value: string
  ) {
    setPodium((previous) =>
      previous.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!competition) {
      setMessageType("error");
      setMessage("Please select a competition.");
      return;
    }

    if (podium.some((item) => !item.targetId)) {
      setMessageType("error");
      setMessage(
        "Please select participants/groups for all three positions."
      );
      return;
    }

    const selectedTargets = podium.map((item) => item.targetId);

    if (new Set(selectedTargets).size !== selectedTargets.length) {
      setMessageType("error");
      setMessage(
        "The same participant/group cannot be selected for multiple positions."
      );
      return;
    }

    for (const item of podium) {
      if (
        item.points.trim() === "" ||
        !Number.isFinite(Number(item.points)) ||
        Number(item.points) < 0
      ) {
        setMessageType("error");
        setMessage("Please enter valid points (0 or above) for all positions.");
        return;
      }
    }

    setSaving(true);
    setMessage("");

    let currentStep = "Connecting to Supabase";

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      currentStep = "Finding existing draft result";

      const { data: existingSet, error: findError } = await supabase
        .from("result_sets")
        .select("id")
        .eq("competition_id", competitionId)
        .eq("status", "DRAFT")
        .limit(1)
        .maybeSingle();

      if (findError) throw findError;

      let resultSetId = existingSet?.id;

      if (!resultSetId) {
        currentStep = "Creating draft result";

        const { data: newSet, error: createError } = await supabase
          .from("result_sets")
          .insert({
            competition_id: competitionId,
            status: "DRAFT",
          })
          .select("id")
          .single();

        if (createError) throw createError;

        if (!newSet?.id) {
          throw new Error(
            "Draft result was created without returning an ID."
          );
        }

        resultSetId = newSet.id;
      }

      currentStep = "Saving podium results";

      const isIndividual =
        competition.competition_type === "INDIVIDUAL";

      for (let index = 0; index < podium.length; index++) {
        const item = podium[index];

        const entry = {
          result_set_id: resultSetId,
          participant_id: isIndividual ? item.targetId : null,
          group_id: isIndividual ? null : item.targetId,
          position: index + 1,
          grade: item.grade || null,
          points: Number(item.points),
        };

        let existingEntryQuery = supabase
          .from("result_entries")
          .select("id")
          .eq("result_set_id", resultSetId);

        if (isIndividual) {
          existingEntryQuery = existingEntryQuery.eq(
            "participant_id",
            item.targetId
          );
        } else {
          existingEntryQuery = existingEntryQuery.eq(
            "group_id",
            item.targetId
          );
        }

        const { data: existingEntry, error: existingEntryError } =
          await existingEntryQuery.maybeSingle();

        if (existingEntryError) throw existingEntryError;

        if (existingEntry?.id) {
          const { error: updateError } = await supabase
            .from("result_entries")
            .update(entry)
            .eq("id", existingEntry.id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("result_entries")
            .insert(entry);

          if (insertError) throw insertError;
        }
      }

      setMessageType("success");
      setMessage(
        "1st, 2nd and 3rd place results saved successfully!"
      );

      setPodium(
        initialPodium.map((item) => ({ ...item }))
      );
    } catch (error: unknown) {
      console.error("RESULT SAVE ERROR:", error);
      console.error("FAILED STEP:", currentStep);

      setMessageType("error");
      setMessage(
        `Failed at: ${currentStep}. ${getErrorMessage(error)}`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div>
        <label className="mb-2 block text-sm text-gray-300">
          Competition
        </label>

        <select
          value={competitionId}
          onChange={(e) => {
            setCompetitionId(e.target.value);
            setPodium(
              initialPodium.map((item) => ({ ...item }))
            );
            setMessage("");
          }}
          required
          className="w-full rounded-lg border border-white/10 bg-[#171717] p-3 text-white"
        >
          <option value="">Select competition</option>

          {competitionSections.map((section) => {
            const sectionCompetitions = competitions.filter(
              (item) =>
                item.competition_section === section.value
            );

            if (sectionCompetitions.length === 0) {
              return null;
            }

            return (
              <optgroup key={section.value} label={section.label}>
                {sectionCompetitions.map((item) => {
                  const categoryLabel =
                    item.category_names.length > 0
                      ? item.category_names.join(", ").toUpperCase()
                      : "CATEGORY NOT ASSIGNED";

                  return (
                    <option key={item.id} value={item.id}>
                      {item.name} — {categoryLabel}
                    </option>
                  );
                })}
              </optgroup>
            );
          })}

          {competitions.some(
            (item) =>
              !competitionSections.some(
                (section) =>
                  section.value === item.competition_section
              )
          ) && (
            <optgroup label="OTHER">
              {competitions
                .filter(
                  (item) =>
                    !competitionSections.some(
                      (section) =>
                        section.value === item.competition_section
                    )
                )
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} —{" "}
                    {item.category_names.length > 0
                      ? item.category_names.join(", ").toUpperCase()
                      : "CATEGORY NOT ASSIGNED"}
                  </option>
                ))}
            </optgroup>
          )}
        </select>
      </div>

      {competition && (
        <>
          <div className="rounded-lg border border-white/10 bg-[#171717] p-4">
            <p className="text-sm font-semibold text-gray-200">
              {competition.name}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              {competition.competition_type === "INDIVIDUAL"
                ? "Select the participants for each position."
                : "Select the groups for each position."}
            </p>
          </div>

          {([1, 2, 3] as const).map((place, index) => {
            const placeLabel =
              place === 1
                ? "1st Place"
                : place === 2
                ? "2nd Place"
                : "3rd Place";

            return (
              <div
                key={place}
                className="space-y-4 rounded-xl border border-white/10 bg-[#202020] p-4"
              >
                <h3 className="text-lg font-bold text-white">
                  {placeLabel}
                </h3>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    {competition.competition_type === "INDIVIDUAL"
                      ? "Participant"
                      : "Group"}
                  </label>

                  <select
                    value={podium[index].targetId}
                    onChange={(e) =>
                      updatePodium(index, "targetId", e.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-white/10 bg-[#171717] p-3 text-white"
                  >
                    <option value="">Select</option>

                    {competition.competition_type === "INDIVIDUAL"
                      ? availableParticipants.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.full_name} (Tag: {item.tag_number})
                          </option>
                        ))
                      : availableGroups.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.group_name}
                          </option>
                        ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Grade (Optional)
                    </label>

                    <select
                      value={podium[index].grade}
                      onChange={(e) =>
                        updatePodium(index, "grade", e.target.value)
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#171717] p-3 text-white"
                    >
                      <option value="">No Grade</option>
                      <option value="A">A Grade</option>
                      <option value="B">B Grade</option>
                      <option value="C">C Grade</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Points
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={podium[index].points}
                      onChange={(e) =>
                        updatePodium(index, "points", e.target.value)
                      }
                      required
                      placeholder="Enter points"
                      className="w-full rounded-lg border border-white/10 bg-[#171717] p-3 text-white"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {competition.competition_type === "INDIVIDUAL" &&
            availableParticipants.length < 3 && (
              <p className="text-sm text-yellow-400">
                At least 3 registered participants are required to enter all three positions.
              </p>
            )}

          {competition.competition_type === "GROUP" &&
            availableGroups.length < 3 && (
              <p className="text-sm text-yellow-400">
                At least 3 groups are required to enter all three positions.
              </p>
            )}
        </>
      )}

      <button
        type="submit"
        disabled={
          saving ||
          !competition ||
          (competition?.competition_type === "INDIVIDUAL" &&
            availableParticipants.length < 3) ||
          (competition?.competition_type === "GROUP" &&
            availableGroups.length < 3)
        }
        className="w-full rounded-lg bg-green-500 px-6 py-3 font-semibold text-black hover:bg-green-400 disabled:opacity-50"
      >
        {saving ? "Saving Results..." : "Save 1st, 2nd & 3rd Results"}
      </button>

      {message && (
        <p
          className={`break-words text-sm ${
            messageType === "success"
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
