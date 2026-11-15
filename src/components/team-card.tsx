"use client";

import type { MouseEvent } from "react";

type TeamCardProps = {
  name: string;
  color: string;
  glow: string;
  description: string;
};

export default function TeamCard({
  name,
  color,
  glow,
  description,
}: TeamCardProps) {
  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        borderColor: `${color}66`,
        backgroundColor: `${color}1A`,
        backgroundImage: `radial-gradient(circle 180px at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glow}, transparent 80%)`,
      }}
      className="rounded-2xl border p-10 text-center transition-all duration-300 hover:-translate-y-2"
    >
      <h3
        className="text-4xl font-extrabold"
        style={{ color }}
      >
        {name}
      </h3>

      <p className="mt-4 leading-7 text-gray-300">
        {description}
      </p>
    </div>
  );
}