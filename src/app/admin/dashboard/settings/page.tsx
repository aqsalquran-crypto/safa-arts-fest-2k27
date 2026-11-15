
import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/admin/dashboard"
          className="text-sm text-green-400 hover:text-green-300"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold tracking-widest text-green-400">
            ADMIN MANAGEMENT
          </p>

          <h1 className="mt-2 text-4xl font-extrabold">
            Website Settings
          </h1>

          <p className="mt-2 text-gray-400">
            Manage festival information and website preferences.
          </p>
        </div>

        <section className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Festival Information</h2>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Festival Name
              </label>
              <input
                type="text"
                defaultValue="SAFA ARTS FEST 2K27"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Festival Theme
              </label>
              <input
                type="text"
                defaultValue="WAQOOLU"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Tagline
              </label>
              <input
                type="text"
                defaultValue="Understanding the Times, Expressing the Truth"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Institution
              </label>
              <input
                type="text"
                defaultValue="SAFA QURAN COLLEGE"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-green-500"
              />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Programme Date & Time</h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Programme Date
              </label>
              <input
                type="date"
                defaultValue="2027-01-02"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Starting Time
              </label>
              <input
                type="time"
                defaultValue="18:00"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white"
              />
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Timezone: Asia/Kolkata (IST)
          </p>
        </section>

        <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Team Information</h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="rounded-lg border border-green-700/40 bg-green-900/10 p-5">
              <h3 className="font-bold text-green-400">FASAHA</h3>
              <p className="mt-2 text-sm text-gray-400">Team Colour</p>
              <p className="mt-1 font-mono">#168343</p>
            </div>

            <div className="rounded-lg border border-blue-700/40 bg-blue-900/10 p-5">
              <h3 className="font-bold text-blue-400">BALAGHA</h3>
              <p className="mt-2 text-sm text-gray-400">Team Colour</p>
              <p className="mt-1 font-mono">#2463C7</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Team names and colours are fixed.
          </p>
        </section>

        <button className="mt-8 rounded-lg bg-green-600 px-8 py-3 font-semibold transition hover:bg-green-500">
          Save Settings
        </button>

      </div>
    </main>
  );
}
