import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "../../utils/supabase-server";
import ParticipantsPublicClient from "./ParticipantsPublicClient";

async function ParticipantsData() {
  await connection();

  const supabase = await createClient();

  const [
    { data: participantRows, error: participantError },
    { data: categoryRows, error: categoryError },
    { data: teamRows, error: teamError },
  ] = await Promise.all([
    supabase
      .from("participants")
      .select("id, full_name, tag_number, category_id, team_id")
      .order("full_name"),

    supabase.from("categories").select("id, name").order("name"),

    supabase.from("teams").select("id, name").order("name"),
  ]);

  const categoryMap = new Map(
    (categoryRows ?? []).map((item) => [item.id, item.name])
  );

  const teamMap = new Map(
    (teamRows ?? []).map((item) => [item.id, item.name])
  );

  const participants = (participantRows ?? []).map((item) => ({
    id: item.id,
    full_name: item.full_name ?? "",
    tag_number: item.tag_number ?? "",
    category_name: categoryMap.get(item.category_id) ?? "",
    team_name: teamMap.get(item.team_id) ?? "",
  }));

  const categories = [
    ...new Set((categoryRows ?? []).map((item) => item.name)),
  ];

  const teams = [
    ...new Set((teamRows ?? []).map((item) => item.name)),
  ];

  return (
    <ParticipantsPublicClient
      participants={participants}
      categories={categories}
      teams={teams}
      error={!!participantError || !!categoryError || !!teamError}
    />
  );
}

export default function ParticipantsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
          Loading participants...
        </div>
      }
    >
      <ParticipantsData />
    </Suspense>
  );
}