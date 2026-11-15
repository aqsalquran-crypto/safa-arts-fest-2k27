
import Link from "next/link";
import { logout } from "./actions";

const modules = [
  {
    title: "Participants",
    description: "Add, edit, search and import participants.",
    href: "/admin/dashboard/participants",
    icon: "👥",
  },
  {
    title: "Competitions",
    description: "Create, edit and manage all festival competitions.",
    href: "/admin/dashboard/competitions",
    icon: "🏆",
  },
  {
    title: "Competition Registration",
    description: "Register participants for individual and group competitions.",
    href: "/admin/dashboard/registrations",
    icon: "📝",
    highlight: true,
  },
  {
    title: "Teams",
    description: "Manage FASAHA, BALAGHA and team members.",
    href: "/admin/dashboard/teams",
    icon: "🛡️",
  },
  {
    title: "Results & Scores",
    description: "Enter grades, manage scores and publish results.",
    href: "/admin/dashboard/results",
    icon: "📊",
  },
  {
    title: "Scoreboard Management",
    description: "Manually enter and manage FASAHA and BALAGHA points across all four categories.",
    href: "/admin/dashboard/scoreboard",
    icon: "🎯",
    highlight: true,
  },
  {
    title: "Public Leaderboard",
    description: "View the overall leaderboard and category-wise scores.",
    href: "/leaderboard",
    icon: "🥇",
  },
  {
    title: "Website Settings",
    description: "Manage festival information and settings.",
    href: "/admin/dashboard/settings",
    icon: "⚙️",
  },
];

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0b] px-5 py-12 text-white sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.3em] text-green-400">
              SAFA ARTS FEST 2K27
            </p>

            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Manage your entire festival website from here.
            </p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-white/15 px-5 py-3 text-sm text-gray-300 transition hover:border-red-500 hover:text-red-400"
            >
              Logout
            </button>
          </form>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className={`group rounded-2xl border p-7 transition duration-300 hover:-translate-y-1 ${
                module.highlight
                  ? "border-green-500/40 bg-green-500/[0.07] hover:border-green-400 hover:bg-green-500/[0.12]"
                  : "border-white/10 bg-white/[0.03] hover:border-green-500/50 hover:bg-white/[0.06]"
              }`}
            >
              <div className="text-3xl">{module.icon}</div>

              <h2 className="mt-5 text-xl font-bold transition group-hover:text-green-400">
                {module.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                {module.description}
              </p>

              <p className="mt-6 text-sm font-semibold text-green-400">
                Manage →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
