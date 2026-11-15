
"use client";

import { useState, type MouseEvent, type ReactNode } from "react";

export default function MouseSpotlight({
  children,
}: {
  children: ReactNode;
}) {
  const [position, setPosition] = useState({ x: -1000, y: -1000 });

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    setPosition({
      x: e.clientX,
      y: e.clientY,
    });
  }

  return (
    <div onMouseMove={handleMouseMove}>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-20"
        style={{
          background: `radial-gradient(
            300px circle at ${position.x}px ${position.y}px,
            rgba(22, 131, 67, 0.13),
            rgba(36, 99, 199, 0.08) 40%,
            transparent 75%
          )`,
        }}
      />

      {children}
    </div>
  );
}
