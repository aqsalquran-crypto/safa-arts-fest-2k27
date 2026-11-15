
import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "../../../../utils/supabase-server";
import ScoreboardClient from "./ScoreboardClient";

async function ScoreboardData() {
  await connection();

  const supabase = await createClient();

  const [
    { data: competitionRows, error: competitionError },
    { data: categoryLinks, error: categoryError },
    { data: categoryRows, error: categoryRowsError },
    { data: scoreRows, error: scoreError },
  ] = await Promise.all([
    supabase
      .from("competitions")
      .select("id, name")
      .order("name"),

    supabase
      .from("competition_categories")
      .select("competition_id, category_id"),

    supabase
      .from("categories")
      .select("id, name")
      .order("name"),

    supabase
      .from("fest_scores")
      .select("id, category, competition_id, fasaha_points, balagha_points")
      .order("created_at"),
  ]);

  const categories = (categoryRows ?? []).map((item) => ({
    id: item.id,
    name: item.name,
  }));

  const linksMap = new Map<string, string[]>();

  (categoryLinks ?? []).forEach((link) => {
    const existing = linksMap.get(link.competition_id) ?? [];

    existing.push(link.category_id);

    linksMap.set(link.competition_id, existing);
  });

  const competitions = (competitionRows ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    eligible_category_ids: linksMap.get(item.id) ?? [],
  }));

  const scores = scoreRows ?? [];

  const error =
    competitionError ||
    categoryError ||
    categoryRowsError ||
    scoreError;

  return (
    <ScoreboardClient
      competitions={competitions}
      categories={categories}
      scores={scores}
      error={error?.message ?? ""}
    />
  );
}

export default function ScoreboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0b0b] p-8 text-white">
          Loading scoreboard...
        </div>
      }
    >
      <ScoreboardData />
    </Suspense>
  );
}
