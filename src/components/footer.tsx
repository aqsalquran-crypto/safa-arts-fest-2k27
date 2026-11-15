
import Link from "next/link";

const footerLinks = [
  { name: "Home", href: "/" },
  { name: "Participants", href: "/participants" },
  { name: "Competitions", href: "/competitions" },
  { name: "Results", href: "/results" },
  { name: "Teams", href: "/teams" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Updates", href: "/updates" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080808] px-5 py-12 text-white sm:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
        {/* Festival Information */}
        <div>
          <h2 className="text-2xl font-extrabold">
            SAFA <span className="text-green-400">ARTS FEST 2K27</span>
          </h2>

          <p className="mt-3 text-lg font-extrabold tracking-wider text-white">
            WAQOOLU
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Understanding the Times, Expressing the Truth.
          </p>

          <p className="mt-4 text-sm text-gray-500">
            SAFA QURAN COLLEGE
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-bold">Quick Links</h3>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 transition hover:text-green-400"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Teams */}
        <div>
          <h3 className="text-lg font-bold">Our Teams</h3>

          <p className="mt-4 font-semibold text-[#168343]">
            FASAHA
          </p>

          <p className="mt-3 font-semibold text-[#2463C7]">
            BALAGHA
          </p>
        </div>
      </div>

      {/* Official AQSA Credit */}
      <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-center">
        <p className="text-xs font-semibold tracking-wide text-gray-400">
            ANWARUL QURAN STUDENTS ASSOCIATION (AQSA)
        </p>

        <p className="mt-3 text-xs text-gray-600">
          © 2027 SAFA ARTS FEST. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
