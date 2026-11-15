import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "../../../../utils/supabase-server";
import RegistrationsClient from "./RegistrationsClient";

type ParticipantRow = {
  id: string;
  full_name: string;
  tag_number: string | null;
  category_id: string | null;
  team_id: string | null;
};

type CompetitionRow = {
  id: string;
  name: string;
  competition_type: string | null;
  status: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
};

type TeamRow = {
  id: string;
  name: string;
};

type CategoryLinkRow = {
  competition_id: string;
  category_id: string;
};

type RegistrationRow = {
  id: string;
  competition_id: string;
  participant_id: string;
};

async function RegistrationsData() {
  await connection();

  const supabase = await createClient();

  const [
    participantResult,
    competitionResult,
    categoryLinkResult,
    categoryResult,
    teamResult,
    registrationResult,
  ] = await Promise.all([
    supabase
      .from("participants")
      .select("id, full_name, tag_number, category_id, team_id")
      .order("full_name"),

    supabase
      .from("competitions")
      .select("id, name, competition_type, status")
      .order("name"),

    supabase
      .from("competition_categories")
      .select("competition_id, category_id"),

    supabase
      .from("categories")
      .select("id, name")
      .order("name"),

    supabase
      .from("teams")
      .select("id, name")
      .order("name"),

    supabase
      .from("competition_registrations")
      .select("id, competition_id, participant_id")
      .order("registered_at", { ascending: false }),
  ]);

  const hasError =
    !!participantResult.error ||
    !!competitionResult.error ||
    !!categoryLinkResult.error ||
    !!categoryResult.error ||
    !!teamResult.error ||
    !!registrationResult.error;

  if (hasError) {
    console.error("Registration data loading error:", {
      participants: participantResult.error,
      competitions: competitionResult.error,
      categoryLinks: categoryLinkResult.error,
      categories: categoryResult.error,
      teams: teamResult.error,
      registrations: registrationResult.error,
    });
  }

  const participantRows =
    (participantResult.data ?? []) as ParticipantRow[];

  const competitionRows =
    (competitionResult.data ?? []) as CompetitionRow[];

  const categoryLinks =
    (categoryLinkResult.data ?? []) as CategoryLinkRow[];

  const categoryRows =
    (categoryResult.data ?? []) as CategoryRow[];

  const teamRows =
    (teamResult.data ?? []) as TeamRow[];

  const registrationRows =
    (registrationResult.data ?? []) as RegistrationRow[];

  const categoryMap = new Map(
    categoryRows.map((item) => [item.id, item.name])
  );

  const teamMap = new Map(
    teamRows.map((item) => [item.id, item.name])
  );

  const participants = participantRows.map((item) => ({
    id: item.id,
    full_name: item.full_name,
    tag_number: item.tag_number ?? "",
    category_id: item.category_id ?? "",
    category_name: item.category_id
      ? categoryMap.get(item.category_id) ?? ""
      : "",
    team_name: item.team_id
      ? teamMap.get(item.team_id) ?? ""
      : "",
  }));

  const eligibleCategories = new Map<string, string[]>();

  categoryLinks.forEach((link) => {
    const existing =
      eligibleCategories.get(link.competition_id) ?? [];

    if (!existing.includes(link.category_id)) {
      existing.push(link.category_id);
    }

    eligibleCategories.set(link.competition_id, existing);
  });

  const competitions = competitionRows.map((item) => ({
    id: item.id,
    name: item.name,
    competition_type: item.competition_type ?? "",
    status: item.status ?? "",
    eligible_category_ids:
      eligibleCategories.get(item.id) ?? [],
  }));

  const categories = categoryRows.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  return (
    <RegistrationsClient
      participants={participants}
      competitions={competitions}
      registrations={registrationRows}
      categories={categories}
      error={hasError}
    />
  );
}

export default function RegistrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] p-8 text-white">
          Loading registrations...
        </div>
      }
    >
      <RegistrationsData />
    </Suspense>
  );
}