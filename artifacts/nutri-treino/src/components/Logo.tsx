import { useLocation } from "wouter";

interface LogoProps {
  size?: "sm" | "md";
}

export default function Logo({ size = "md" }: LogoProps) {
  const [, setLocation] = useLocation();

  const iconSize = size === "sm" ? 28 : 32;
  const textSize = size === "sm" ? "text-lg" : "text-xl";
  const gap = size === "sm" ? "gap-2" : "gap-2.5";

  return (
    <button
      onClick={() => setLocation("/")}
      className={`flex items-center ${gap} hover:opacity-80 transition-opacity`}
      aria-label="Ir para o início"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="20" cy="20" r="20" fill="#22c55e" />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill="#000000"
          fontSize="22"
          fontWeight="700"
          fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
          letterSpacing="-0.5"
        >
          e
        </text>
      </svg>
      <span
        className={`${textSize} font-bold tracking-tight text-white leading-none`}
      >
        evolute
      </span>
    </button>
  );
}
