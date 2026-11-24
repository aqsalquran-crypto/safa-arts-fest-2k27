
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCompetition } from "./actions";

type Category = {
  id: string;
  name: string;
};

const COMPETITION_CATEGORIES = [
  "BIDAYA",
  "THANAVIYYA",
  "ALIYA",
  "KULLIYYA",
] as const;

export default function AddCompetitionForm({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const [selectedCompetitionCategory, setSelectedCompetitionCategory] =
    useState("");

  function getEligibleCategories(categoryName: string) {
    const normalizedName = categoryName.trim().toUpperCase();

    if (normalizedName === "KULLIYYA") {
      return categories.filter((category) =>
        COMPETITION_CATEGORIES.includes(
          category.name.trim().toUpperCase() as
            (typeof COMPETITION_CATEGORIES)[number]
        )
      );
    }

    return categories.filter(
      (category) =>
        category.name.trim().toUpperCase() === normalizedName
    );
  }

  const eligibleCategories = getEligibleCategories(
    selectedCompetitionCategory
  );

  function handleCategoryChange(value: string) {
    setSelectedCompetitionCategory(value);
    setMessage("");
  }

  function handleSubmit(formData: FormData) {
    setMessage("");

    startTransition(async () => {
      const result = await addCompetition(formData);
      setMessage(result.message);

      if (result.success) {
        router.refresh();

        setTimeout(() => {
          setOpen(false);
          setSelectedCompetitionCategory("");
          setMessage("");
        }, 800);
      }
    });
  }

  function closeForm() {
    setOpen(false);
    setSelectedCompetitionCategory("");
    setMessage("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage("");
          setOpen(true);
        }}
        className="rounded-lg bg-green-600 px-6 py-3 font-semibold transition hover:bg-green-500"
      >
        + Add Competition
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#151515] p-6 shadow-2xl">

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Add Competition
              </h2>

              <button
                type="button"
                onClick={closeForm}
                className="text-2xl text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <form action={handleSubmit} className="space-y-5">

              {/* Competition Name */}
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Competition Name *
                </label>

                <input
                  name="name"
                  required
                  placeholder="Enter competition name"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-green-500"
                />
              </div>

              {/* Competition Category */}
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Competition Category *
                </label>

                <select
                  name="competition_category"
                  required
                  value={selectedCompetitionCategory}
                  onChange={(e) =>
                    handleCategoryChange(e.target.value)
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#202020] px-4 py-3 text-white"
                >
                  <option value="" disabled>
                    Select category
                  </option>

                  <option value="BIDAYA">BIDAYA</option>
                  <option value="THANAVIYYA">THANAVIYYA</option>
                  <option value="ALIYA">ALIYA</option>
                  <option value="KULLIYYA">KULLIYYA (GENERAL)</option>
                </select>
              </div>

              {/* Competition Section */}
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Competition Section *
                </label>

                <select
                  name="competition_section"
                  required
                  defaultValue=""
                  className="w-full rounded-lg border border-white/10 bg-[#202020] px-4 py-3 text-white"
                >
                  <option value="" disabled>
                    Select section
                  </option>

                  <option value="STAGE">
                    Stage Competition
                  </option>

                  <option value="OFF_STAGE">
                    Off Stage Competition
                  </option>

                  <option value="SPORTS">
                    Sports
                  </option>
                </select>
              </div>

              {/* Competition Type */}
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Competition Type *
                </label>

                <select
                  name="competition_type"
                  required
                  defaultValue=""
                  className="w-full rounded-lg border border-white/10 bg-[#202020] px-4 py-3 text-white"
                >
                  <option value="" disabled>
                    Select type
                  </option>

                  <option value="INDIVIDUAL">
                    Individual
                  </option>

                  <option value="GROUP">
                    Group
                  </option>
                </select>
              </div>

              {/* Eligible Categories */}
              <div>
                <label className="mb-3 block text-sm text-gray-300">
                  Eligible Categories
                </label>

                {selectedCompetitionCategory === "KULLIYYA" && (
                  <div className="mb-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                    <p className="text-sm font-semibold text-green-400">
                      KULLIYYA — General Competition
                    </p>

                    <p className="mt-1 text-xs text-gray-300">
                      Students from all four categories can
                      participate in this competition.
                    </p>
                  </div>
                )}

                {selectedCompetitionCategory &&
                  selectedCompetitionCategory !== "KULLIYYA" && (
                    <p className="mb-3 text-xs text-gray-400">
                      Only students belonging to the selected
                      category can participate.
                    </p>
                  )}

                <div className="grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-black/20 p-4 sm:grid-cols-3">

                  {eligibleCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked
                        readOnly
                        className="accent-green-500"
                      />

                      <span>{category.name}</span>

                      {/* Submitted automatically */}
                      <input
                        type="hidden"
                        name="category_ids"
                        value={category.id}
                      />
                    </div>
                  ))}

                  {!selectedCompetitionCategory && (
                    <p className="col-span-full text-sm text-gray-500">
                      Select a competition category first.
                    </p>
                  )}

                  {selectedCompetitionCategory &&
                    eligibleCategories.length === 0 && (
                      <p className="col-span-full text-sm text-red-400">
                        No matching categories found in the database.
                      </p>
                    )}
                </div>
              </div>

              {/* Public Visibility */}
              <label className="flex items-center gap-3 text-sm text-gray-300">
                <input
                  type="checkbox"
                  name="is_public"
                  className="h-4 w-4 accent-green-500"
                />

                Make this competition public
              </label>

              {/* Message */}
              {message && (
                <p className="rounded-lg bg-white/5 p-3 text-sm text-yellow-400">
                  {message}
                </p>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-white/10 px-5 py-3 text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isPending ||
                    !selectedCompetitionCategory ||
                    eligibleCategories.length === 0
                  }
                  className="rounded-lg bg-green-600 px-6 py-3 font-semibold hover:bg-green-500 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Competition"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
