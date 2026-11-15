
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AddCompetitionForm from "./AddCompetitionForm";
import { deleteCompetition } from "./actions";

type Competition = {
  id: string;
  name: string;
  competition_category: string;
  competition_section: string;
  competition_type: string;
  is_public: boolean;
  eligible_categories: string[];
};

type Props = {
  competitions: Competition[];
  categories: { id: string; name: string }[];
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
  "SPORTS",
];

export default function CompetitionsClient({
  competitions,
  categories,
  error = false,
}: Props) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [type, setType] = useState("All Types");
  const [category, setCategory] = useState("All Categories");
  const [section, setSection] = useState("All Sections");
  const [deletingId, setDeletingId] = useState<string | null>(null);


  const filteredCompetitions = useMemo(() => {
    const categoryOrder = [
      "BIDAYA",
      "THANAVIYYA",
      "ALIYA",
      "KULLIYA",
    ];

    const sectionOrder = [
      "STAGE",
      "OFF_STAGE",
      "SPORTS",
    ];

    return competitions
      .filter((competition) => {
        const matchesSearch = competition.name
          .toLowerCase()
          .includes(search.toLowerCase());

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
      })
      .sort((a, b) => {
        const categoryA = categoryOrder.indexOf(a.competition_category);
        const categoryB = categoryOrder.indexOf(b.competition_category);

        const sortedCategoryA =
          categoryA === -1 ? 999 : categoryA;
        const sortedCategoryB =
          categoryB === -1 ? 999 : categoryB;

        if (sortedCategoryA !== sortedCategoryB) {
          return sortedCategoryA - sortedCategoryB;
        }

        const sectionA = sectionOrder.indexOf(a.competition_section);
        const sectionB = sectionOrder.indexOf(b.competition_section);

        const sortedSectionA =
          sectionA === -1 ? 999 : sectionA;
        const sortedSectionB =
          sectionB === -1 ? 999 : sectionB;

        if (sortedSectionA !== sortedSectionB) {
          return sortedSectionA - sortedSectionB;
        }

        return a.name.localeCompare(b.name);
      });
  }, [competitions, search, type, category, section]);


  const individualCount = competitions.filter(
    (item) => item.competition_type.toLowerCase() === "individual"
  ).length;

  const groupCount = competitions.filter(
    (item) => item.competition_type.toLowerCase() === "group"
  ).length;

  async function handleDelete(competition: Competition) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${competition.name}"?\n\n` +
        "This will also delete its linked registrations, groups and category links. " +
        "The deletion will be blocked if results already exist.\n\n" +
        "This action cannot be undone."
    );

    if (!confirmed) return;

    setDeletingId(competition.id);

    try {
      const result = await deleteCompetition(competition.id);

      if (!result.success) {
        window.alert(result.message);
        return;
      }

      window.alert(result.message);
      router.refresh();
    } catch (error) {
      console.error("Delete competition error:", error);
      window.alert("Something went wrong while deleting the competition.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <a
          href="/admin/dashboard"
          className="text-sm text-green-400 hover:text-green-300"
        >
          ← Back to Dashboard
        </a>

        <div className="mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold tracking-widest text-green-400">
              ADMIN MANAGEMENT
            </p>

            <h1 className="mt-2 text-4xl font-extrabold">
              Competitions
            </h1>

            <p className="mt-2 text-gray-400">
              Create and manage SAFA Arts Fest competitions.
            </p>
          </div>

          <AddCompetitionForm categories={categories} />
        </div>

        {/* Statistics */}
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <StatCard
            label="Total Competitions"
            value={competitions.length}
          />

          <StatCard
            label="Individual Competitions"
            value={individualCount}
            color="text-green-400"
          />

          <StatCard
            label="Group Competitions"
            value={groupCount}
            color="text-blue-400"
          />
        </div>

        {/* Search and Filters */}
        <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search competitions..."
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-green-500"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#171717] px-4 py-3 text-white"
            >
              <option>All Categories</option>
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
              <option>All Sections</option>
              {competitionSections.map((item) => (
                <option key={item} value={item}>
                  {item === "STAGE"
                    ? "Stage Competition"
                    : item === "OFF_STAGE"
                      ? "Off Stage Competition"
                      : "Sports"}
                </option>
              ))}
            </select>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#171717] px-4 py-3 text-white"
            >
              <option>All Types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="GROUP">Group</option>
            </select>
          </div>

          {error ? (
            <p className="py-16 text-center text-red-400">
              Could not load competitions. Check Supabase permissions.
            </p>
          ) : (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-sm text-gray-400">
                    <th className="px-4 py-4">COMPETITION</th>
                    <th className="px-4 py-4">CATEGORY</th>
                    <th className="px-4 py-4">SECTION</th>
                    <th className="px-4 py-4">TYPE</th>
                    <th className="px-4 py-4">ELIGIBLE CATEGORIES</th>
                    <th className="px-4 py-4">VISIBILITY</th>
                    <th className="px-4 py-4">ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCompetitions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-16 text-center text-gray-500"
                      >
                        No competitions found.
                      </td>
                    </tr>
                  ) : (
                    filteredCompetitions.map((competition) => (
                      <tr
                        key={competition.id}
                        className="border-b border-white/5 hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-4 font-semibold">
                          {competition.name}
                        </td>

                        <td className="px-4 py-4 text-gray-300">
                          {competition.competition_category || "Not assigned"}
                        </td>

                        <td className="px-4 py-4 text-gray-300">
                          {competition.competition_section === "STAGE"
                            ? "Stage Competition"
                            : competition.competition_section === "OFF_STAGE"
                              ? "Off Stage Competition"
                              : competition.competition_section === "SPORTS"
                                ? "Sports"
                                : "Not assigned"}
                        </td>

                        <td className="px-4 py-4 text-gray-300">
                          {competition.competition_type || "—"}
                        </td>

                        <td className="px-4 py-4 text-gray-300">
                          {competition.eligible_categories.join(", ") || "—"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={
                              competition.is_public
                                ? "text-green-400"
                                : "text-gray-500"
                            }
                          >
                            {competition.is_public ? "Public" : "Private"}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => handleDelete(competition)}
                            disabled={deletingId !== null}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === competition.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!error && (
            <p className="mt-4 text-sm text-gray-500">
              Showing {filteredCompetitions.length} of {competitions.length} competitions
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-gray-400">{label}</p>
      <h2 className={`mt-3 text-3xl font-bold ${color}`}>{value}</h2>
    </div>
  );
}
