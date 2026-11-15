
"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Competition = {
  id: string;
  name: string;
  competition_type: "INDIVIDUAL" | "GROUP";
  category_ids: string[];
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

const positionPoints: Record<string, number> = {
  "1": 5,
  "2": 3,
  "3": 1,
};

const gradePoints: Record<string, number> = {
  A: 5,
  B: 3,
  C: 1,
};

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
  const [targetId, setTargetId] = useState("");
  const [position, setPosition] = useState("1");
  const [grade, setGrade] = useState("A");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const competition = competitions.find(
    (item) => item.id === competitionId
  );

  // Only show participants registered for the selected competition.
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

  const totalPoints =
    (positionPoints[position] ?? 0) +
    (gradePoints[grade] ?? 0);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!competition || !targetId) {
      setMessageType("error");
      setMessage("Please select a competition and participant/group.");
      return;
    }

    if (!positionPoints[position] || !gradePoints[grade]) {
      setMessageType("error");
      setMessage("Please select a valid position and grade.");
      return;
    }

    setSaving(true);
    setMessage("");

    let currentStep = "Connecting to Supabase";

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // STEP 1: Find existing draft.
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

      // STEP 2: Create draft if it does not exist.
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

      // STEP 3: Insert result entry.
      currentStep = "Saving result entry";

      const isIndividual =
        competition.competition_type === "INDIVIDUAL";

      const entry = {
        result_set_id: resultSetId,
        participant_id: isIndividual ? targetId : null,
        group_id: isIndividual ? null : targetId,
        position: Number(position),
        grade,
        points: totalPoints,
      };

      const { error: insertError } = await supabase
        .from("result_entries")
        .insert(entry);

      if (insertError) throw insertError;

      setMessageType("success");
      setMessage(
        `Result saved successfully! ${totalPoints} points awarded.`
      );

      setTargetId("");
      setPosition("1");
      setGrade("A");
    } catch (error: unknown) {
      console.error("RESULT SAVE ERROR:", error);
      console.error("FAILED STEP:", currentStep);

      if (typeof error === "object" && error !== null) {
        console.error(
          "ERROR DETAILS:",
          Object.getOwnPropertyNames(error).reduce(
            (result, key) => {
              result[key] = (error as Record<string, unknown>)[key];
              return result;
            },
            {} as Record<string, unknown>
          )
        );
      }

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
            setTargetId("");
            setMessage("");
          }}
          required
          className="w-full rounded-lg border border-white/10 bg-[#171717] p-3 text-white"
        >
          <option value="">Select competition</option>

          {competitions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {competition && (
        <div>
          <label className="mb-2 block text-sm text-gray-300">
            {competition.competition_type === "INDIVIDUAL"
              ? "Participant"
              : "Group"}
          </label>

          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
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

          {competition.competition_type === "INDIVIDUAL" &&
            availableParticipants.length === 0 && (
              <p className="mt-2 text-sm text-yellow-400">
                No participants are registered for this competition yet.
              </p>
            )}

          {competition.competition_type === "GROUP" &&
            availableGroups.length === 0 && (
              <p className="mt-2 text-sm text-yellow-400">
                No groups have been created for this competition yet.
              </p>
            )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-gray-300">
            Position
          </label>

          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-[#171717] p-3 text-white"
          >
            <option value="1">1st Place (5 points)</option>
            <option value="2">2nd Place (3 points)</option>
            <option value="3">3rd Place (1 point)</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-gray-300">
            Grade
          </label>

          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-[#171717] p-3 text-white"
          >
            <option value="A">A Grade (5 points)</option>
            <option value="B">B Grade (3 points)</option>
            <option value="C">C Grade (1 point)</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
        <p className="text-sm text-gray-300">Total Points</p>

        <p className="mt-1 text-3xl font-bold text-green-400">
          {totalPoints}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          Position: {positionPoints[position]} + Grade:{" "}
          {gradePoints[grade]}
        </p>
      </div>

      <button
        type="submit"
        disabled={
          saving ||
          !competitions.length ||
          (competition?.competition_type === "INDIVIDUAL" &&
            availableParticipants.length === 0) ||
          (competition?.competition_type === "GROUP" &&
            availableGroups.length === 0)
        }
        className="rounded-lg bg-green-500 px-6 py-3 font-semibold text-black hover:bg-green-400 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Result"}
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