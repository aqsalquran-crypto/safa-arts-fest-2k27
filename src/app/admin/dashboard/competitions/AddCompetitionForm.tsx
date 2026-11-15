
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCompetition } from "./actions";

type Category = {
  id: string;
  name: string;
};

export default function AddCompetitionForm({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage("");

    startTransition(async () => {
      const result = await addCompetition(formData);
      setMessage(result.message);

      if (result.success) {
        router.refresh();
        setTimeout(() => setOpen(false), 800);
      }
    });
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
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Add Competition</h2>

              <button
                type="button"
                onClick={() => setOpen(false)}
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
                  defaultValue=""
                  className="w-full rounded-lg border border-white/10 bg-[#202020] px-4 py-3 text-white"
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  <option value="BIDAYA">BIDAYA</option>
                  <option value="THANAVIYYA">THANAVIYYA</option>
                  <option value="ALIYA">ALIYA</option>
                  <option value="KULLIYA">KULLIYA</option>
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
                  <option value="STAGE">Stage Competition</option>
                  <option value="OFF_STAGE">Off Stage Competition</option>
                  <option value="SPORTS">Sports</option>
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
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="GROUP">Group</option>
                </select>
              </div>

              {/* Eligible Categories */}
              <div>
                <label className="mb-3 block text-sm text-gray-300">
                  Eligible Categories
                </label>

                <div className="grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-black/20 p-4 sm:grid-cols-3">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <input
                        type="checkbox"
                        name="category_ids"
                        value={category.id}
                        className="accent-green-500"
                      />
                      {category.name}
                    </label>
                  ))}

                  {categories.length === 0 && (
                    <p className="col-span-full text-sm text-gray-500">
                      No categories found.
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

              {message && (
                <p className="rounded-lg bg-white/5 p-3 text-sm text-yellow-400">
                  {message}
                </p>
              )}

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-white/10 px-5 py-3 text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
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
