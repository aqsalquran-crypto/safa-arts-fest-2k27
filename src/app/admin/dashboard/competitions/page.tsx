
import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "../../../../utils/supabase-server";
import CompetitionsClient from "./CompetitionsClient";

async function CompetitionsData() {
  await connection();

  const supabase = await createClient();

  const [
    { data: competitionRows, error: competitionError },
    { data: categoryLinks, error: categoryError },
    { data: categoryRows, error: categoryRowsError },
  ] = await Promise.all([
    supabase
      .from("competitions")
      .select(
        "id, name, competition_category, competition_section, competition_type, is_public"
      )
      .order("name"),

    supabase
      .from("competition_categories")
      .select("competition_id, category_id"),

    supabase
      .from("categories")
      .select("id, name")
      .order("name"),
  ]);

  const categories = (categoryRows ?? []).map((category) => ({
    id: category.id,
    name: category.name,
  }));

  const categoryMap = new Map(
    categories.map((category) => [category.id, category.name])
  );

  const linksMap = new Map<string, string[]>();

  (categoryLinks ?? []).forEach((link) => {
    const categoryName = categoryMap.get(link.category_id);

    if (!categoryName) return;

    const existing = linksMap.get(link.competition_id) ?? [];

    existing.push(categoryName);

    linksMap.set(link.competition_id, existing);
  });

  const competitions = (competitionRows ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    competition_category: item.competition_category ?? "",
    competition_section: item.competition_section ?? "",
    competition_type: item.competition_type ?? "",
    is_public: item.is_public ?? false,
    eligible_categories: linksMap.get(item.id) ?? [],
  }));

  return (
    <CompetitionsClient
      competitions={competitions}
      categories={categories}
      error={
        !!competitionError ||
        !!categoryError ||
        !!categoryRowsError
      }
    />
  );
}

export default function CompetitionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0b0b] p-8 text-white">
          Loading competitions...
        </div>
      }
    >
      <CompetitionsData />
    </Suspense>
  );
}
