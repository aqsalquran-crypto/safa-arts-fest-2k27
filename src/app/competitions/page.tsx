
import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "../../utils/supabase-server";
import CompetitionsPublicClient from "./CompetitionsPublicClient";

type CompetitionRow = {
  id: string;
  name: string;
  description: string | null;
  competition_category: string | null;
  competition_section: string | null;
  competition_type: string | null;
  status: string | null;
  is_public: boolean | null;
};

type Category = {
  id: string;
  name: string;
};

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
        "id, name, description, competition_category, competition_section, competition_type, status, is_public"
      )
      .eq("is_public", true)
      // Oldest registered competition appears first.
      .order("created_at", { ascending: true }),

    supabase
      .from("competition_categories")
      .select("competition_id, category_id"),

    supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  if (competitionError || categoryError || categoryRowsError) {
    console.error("Public competitions loading error:", {
      competitionError,
      categoryError,
      categoryRowsError,
    });

    return <CompetitionsPublicClient competitions={[]} error />;
  }

  const categories = (categoryRows ?? []) as Category[];
  const competitionsData = (competitionRows ?? []) as CompetitionRow[];

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

  const competitions = competitionsData.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    competition_category: item.competition_category ?? "",
    competition_section: item.competition_section ?? "",
    competition_type: item.competition_type ?? "",
    status: item.status ?? "",
    eligible_categories: linksMap.get(item.id) ?? [],
  }));

  return (
    <CompetitionsPublicClient competitions={competitions} />
  );
}

export default function CompetitionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
          Loading competitions...
        </div>
      }
    >
      <CompetitionsData />
    </Suspense>
  );
}
