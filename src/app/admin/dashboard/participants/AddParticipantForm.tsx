
"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addParticipant } from "./actions";

export default function AddParticipantForm({
  categories,
  teams,
}: {
  categories: string[];
  teams: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const [fullName, setFullName] = useState("");
  const [tagNumber, setTagNumber] = useState("");
  const [category, setCategory] = useState("");
  const [team, setTeam] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    startTransition(async () => {
      const result = await addParticipant({
        full_name: fullName,
        tag_number: tagNumber,
        category_name: category,
        team_name: team,
      });

      setMessage(result.message);
      setSuccess(result.success);

      if (result.success) {
        setFullName("");
        setTagNumber("");
        setCategory("");
        setTeam("");
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
        className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-500"
      >
        + Add Participant
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#151515] p-7 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold tracking-widest text-green-400">
                  ADMIN MANAGEMENT
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Add Participant
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl text-gray-400 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Full Name
                </label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter participant name"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Tag Number
                </label>
                <input
                  required
                  value={tagNumber}
                  onChange={(e) => setTagNumber(e.target.value)}
                  placeholder="Enter tag number"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Category
                </label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#202020] px-4 py-3 outline-none focus:border-green-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Team
                </label>
                <select
                  required
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#202020] px-4 py-3 outline-none focus:border-green-500"
                >
                  <option value="">Select Team</option>
                  {teams.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {message && (
                <p className={success ? "text-green-400" : "text-red-400"}>
                  {message}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-white/10 px-5 py-3 text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Participant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
