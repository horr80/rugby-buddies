export function RugbyBall({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <ellipse
        cx="32"
        cy="32"
        rx="28"
        ry="18"
        transform="rotate(-35 32 32)"
        fill="#C87533"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="28"
        ry="18"
        transform="rotate(-35 32 32)"
        fill="url(#rb-grad)"
      />
      {/* Seam line */}
      <line x1="14" y1="50" x2="50" y2="14" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      {/* Cross stitches */}
      <line x1="24" y1="42" x2="20" y2="36" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="24" y1="42" x2="28" y2="38" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="30" y1="36" x2="26" y2="30" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="30" y1="36" x2="34" y2="32" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="36" y1="30" x2="32" y2="24" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="36" y1="30" x2="40" y2="26" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <defs>
        <linearGradient id="rb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A843" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#8B4513" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
}
