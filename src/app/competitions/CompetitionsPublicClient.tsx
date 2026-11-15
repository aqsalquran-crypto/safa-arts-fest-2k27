
"use client";

import { useMemo, useState } from "react";

type Competition = {
  id: string;
  name: string;
  competition_category: string;
  competition_section: string;
  competition_type: string;
  eligible_categories: string[];
};

type Props = {
  competitions: Competition[];
  error?: boolean;
};

const competitionCategories = [
  "BIDAYA",
  "THANAVIYYA",
  "ALIYA",
  "KULLIYA",
];

const competitionSections = [
  "STAGE",
  "OFF_STAGE",
];

export default function CompetitionsPublicClient({
  competitions,
  error = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All Types");
  const [category, setCategory] = useState("All Categories");
  const [section, setSection] = useState("All Sections");

  const filteredCompetitions = useMemo(() => {
    // Hide SPORTS competitions from the public page.
    // They remain available in the database and admin dashboard.
    return competitions.filter((competition) => {
      if (competition.competition_section === "SPORTS") {
        return false;
      }

      const searchText = search.toLowerCase();

      const matchesSearch =
        competition.name.toLowerCase().includes(searchText) ||
        competition.competition_category.toLowerCase().includes(searchText) ||
        competition.competition_section.toLowerCase().includes(searchText);

      const matchesType =
        type === "All Types" ||
        competition.competition_type.toLowerCase() === type.toLowerCase();

      const matchesCategory =
        category === "All Categories" ||
        competition.competition_category === category;

      const matchesSection =
        section === "All Sections" ||
        competition.competition_section === section;

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesSection
      );
    });
  }, [competitions, search, type, category, section]);

  const visibleCompetitionsCount = competitions.filter(
    (competition) => competition.competition_section !== "SPORTS"
  ).length;

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-5 py-16 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold tracking-[0.3em] text-blue-400">
          SAFA ARTS FEST 2K27
        </p>

        <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
          Competitions
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-gray-400">
          Explore the competitions of SAFA ARTS FEST 2K27.
          Discover competition categories and participation information.
        </p>

        {/* Search and Filters */}
        <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search competitions..."
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#171717] px-4 py-3 text-white"
            >
              <option value="All Categories">All Categories</option>
              {competitionCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#171717] px-4 py-3 text-white"
            >
              <option value="All Sections">All Sections</option>
              {competitionSections.map((item) => (
                <option key={item} value={item}>
                  {item === "STAGE"
                    ? "Stage Competition"
                    : "Off Stage Competition"}
                </option>
              ))}
            </select>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#171717] px-4 py-3 text-white"
            >
              <option value="All Types">All Types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="GROUP">Group</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="mt-10 rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <h2 className="text-xl font-semibold text-red-400">
              Could not load competitions.
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              Please check Supabase permissions and try again.
            </p>
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-white/20 bg-white/[0.03] p-10 text-center">
            <h2 className="text-xl font-semibold text-gray-300">
              No competitions found.
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCompetitions.map((competition, index) => (
              <article
                key={competition.id}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-blue-500/40"
              >
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                  {competition.competition_type || "Competition"}
                </span>

                <p className="mt-5 text-xs font-semibold text-gray-500">
                  COMPETITION {index + 1}
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  {competition.name}
                </h2>

                {competition.competition_category && (
                  <p className="mt-3 text-sm font-medium text-blue-300">
                    {competition.competition_category}
                  </p>
                )}

                {competition.competition_section && (
                  <p className="mt-1 text-sm text-gray-400">
                    {competition.competition_section === "STAGE"
                      ? "Stage Competition"
                      : competition.competition_section === "OFF_STAGE"
                        ? "Off Stage Competition"
                        : "Section not assigned"}
                  </p>
                )}

                <div className="mt-6 border-t border-white/10 pt-5">
                  <h3 className="text-sm font-semibold text-gray-300">
                    Eligible Categories
                  </h3>

                  {competition.eligible_categories.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {competition.eligible_categories.map((item) => (
                        <span
                          key={item}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-gray-500">
                      No categories specified.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {!error && (
          <p className="mt-6 text-sm text-gray-500">
            Showing {filteredCompetitions.length} of {visibleCompetitionsCount} public competitions
          </p>
        )}
      </div>
    </main>
  );
}
