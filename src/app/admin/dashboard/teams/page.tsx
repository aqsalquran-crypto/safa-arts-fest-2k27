
import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "../../../../utils/supabase-server";
import TeamsClient from "./TeamsClient";

async function TeamsData() {
  await connection();

  const supabase = await createClient();

  const [
    { data: teamRows, error: teamError },
    { data: participantRows, error: participantError },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select(`
        id,
        name,
        color,
        logo_url,
        introduction,
        manager_id,
        captain_id,
        vice_captain_id,
        manager:participants!teams_manager_id_fkey (
          id,
          full_name,
          tag_number
        ),
        captain:participants!teams_captain_id_fkey (
          id,
          full_name,
          tag_number
        ),
        vice_captain:participants!teams_vice_captain_id_fkey (
          id,
          full_name,
          tag_number
        )
      `)
      .order("name"),

    supabase
      .from("participants")
      .select("id, full_name, tag_number, team_id")
      .order("full_name"),
  ]);

  const teams = (teamRows ?? []).map((team: any) => {
    const members = (participantRows ?? [])
      .filter((participant) => participant.team_id === team.id)
      .map((participant) => ({
        id: participant.id,
        full_name: participant.full_name,
        tag_number: participant.tag_number,
      }));

    return {
      id: team.id,
      name: team.name,
      color: team.color,
      logo_url: team.logo_url,
      introduction: team.introduction ?? "",

      manager_id: team.manager_id,
      captain_id: team.captain_id,
      vice_captain_id: team.vice_captain_id,

      manager_name: team.manager?.full_name ?? "",
      captain_name: team.captain?.full_name ?? "",
      vice_captain_name: team.vice_captain?.full_name ?? "",

      members,
    };
  });

  return (
    <TeamsClient
      teams={teams}
      error={!!teamError || !!participantError}
    />
  );
}

export default function TeamsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0b0b] p-8 text-white">
          Loading teams...
        </div>
      }
    >
      <TeamsData />
    </Suspense>
  );
}
