
"use client";

import { useEffect, useState } from "react";

export default function Countdown() {
  const targetDate = new Date(
    "2027-01-02T18:00:00+05:30"
  ).getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    function updateCountdown() {
      const difference = targetDate - Date.now();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        setIsStarted(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    }

    updateCountdown();

    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isStarted) {
    return (
      <h2 className="mt-8 text-3xl font-bold text-green-400">
        THE CELEBRATION BEGINS!
      </h2>
    );
  }

  const items = [
    { label: "DAYS", value: timeLeft.days },
    { label: "HOURS", value: timeLeft.hours },
    { label: "MINUTES", value: timeLeft.minutes },
    { label: "SECONDS", value: timeLeft.seconds },
  ];

  return (
    <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/15 bg-white/5 px-6 py-5"
        >
          <p className="text-3xl font-bold text-green-400 md:text-4xl">
            {String(item.value).padStart(2, "0")}
          </p>
          <p className="mt-2 text-xs tracking-widest text-gray-400">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
