
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Participants", href: "/participants" },
  { name: "Teams", href: "/teams" },
  { name: "Competition", href: "/competitions" },
  { name: "Results", href: "/results" },
  { name: "Leaderboard", href: "/leaderboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="relative z-50 border-b border-white/10 bg-[#0b0b0b]/95 px-5 py-5 backdrop-blur-md sm:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
  href="/"
  className="text-xl font-extrabold tracking-wide text-green-400"
  onClick={() => setMenuOpen(false)}
>
  AQSA <span className="text-white">2026-27</span>
</Link>
        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-green-500/15 text-green-400"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg border border-white/15 px-4 py-2 text-xl text-white lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-5 lg:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`rounded-lg px-4 py-3 text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-green-500/15 text-green-400"
                  : "bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
