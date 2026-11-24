
import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "../../../../utils/supabase-server";
import RegistrationsClient from "./RegistrationsClient";

async function RegistrationsData() {
  await connection();

  const supabase = await createClient();

  const [
    { data: participantData, error: participantError },
    { data: competitionData, error: competitionError },
    { data: categoryLinkData, error: categoryLinkError },
    { data: categoryData, error: categoryError },
    { data: teamData, error: teamError },
    { data: registrationData, error: registrationError },
    { data: groupData, error: groupError },
    { data: groupMemberData, error: groupMemberError },
  ] = await Promise.all([
    supabase
      .from("participants")
      .select("id, full_name, tag_number, category_id, team_id"),

    supabase
      .from("competitions")
      .select("id, name, competition_type, status"),

    supabase
      .from("competition_categories")
      .select("competition_id, category_id"),

    supabase
      .from("categories")
      .select("id, name"),

    supabase
      .from("teams")
      .select("id, name"),

    supabase
      .from("competition_registrations")
      .select("id, competition_id, participant_id")
      .order("registered_at", { ascending: false }),

    supabase
      .from("competition_groups")
      .select("id, competition_id, team_id, group_name")
      .order("created_at", { ascending: false }),

    supabase
      .from("competition_group_members")
      .select("group_id, participant_id, competition_id"),
  ]);

  const hasError = Boolean(
    participantError ||
      competitionError ||
      categoryLinkError ||
      categoryError ||
      teamError ||
      registrationError ||
      groupError ||
      groupMemberError
  );

  const categories = (categoryData || []).map((category) => ({
    id: category.id,
    name: category.name,
  }));

  const teams = (teamData || []).map((team) => ({
    id: team.id,
    name: team.name,
  }));

  const participants = (participantData || []).map((participant) => ({
    id: participant.id,
    full_name: participant.full_name,
    tag_number: participant.tag_number || "",
    category_id: participant.category_id || "",
    category_name:
      categories.find(
        (category) => category.id === participant.category_id
      )?.name || "Unknown",
    team_id: participant.team_id || null,
    team_name:
      teams.find((team) => team.id === participant.team_id)?.name ||
      "Unknown",
  }));

  const competitions = (competitionData || []).map((competition) => ({
    id: competition.id,
    name: competition.name,
    competition_type: competition.competition_type,
    status: competition.status,
    eligible_category_ids: (categoryLinkData || [])
      .filter((link) => link.competition_id === competition.id)
      .map((link) => link.category_id),
  }));

  const groups = (groupData || []).map((group) => ({
    id: group.id,
    competition_id: group.competition_id,
    team_id: group.team_id,
    group_name: group.group_name,
    participant_ids: (groupMemberData || [])
      .filter((member) => member.group_id === group.id)
      .map((member) => member.participant_id),
  }));

  return (
    <RegistrationsClient
      participants={participants}
      competitions={competitions}
      registrations={registrationData || []}
      categories={categories}
      teams={teams}
      groups={groups}
      error={hasError}
    />
  );
}

export default function RegistrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">Loading registrations...</div>
      }
    >
      <RegistrationsData />
    </Suspense>
  );
}
