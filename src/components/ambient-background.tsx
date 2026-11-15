export default function AmbientBackground() {
  return (
    <div
      className="ambient-background"
      aria-hidden="true"
    >
      {Array.from({ length: 18 }).map((_, index) => (
        <span
          key={index}
          className="light-particle"
          style={{
            left: `${(index * 37) % 100}%`,
            animationDelay: `${(index % 6) * 1.5}s`,
            animationDuration: `${12 + (index % 5) * 3}s`,
          }}
        />
      ))}
    </div>
  );
}