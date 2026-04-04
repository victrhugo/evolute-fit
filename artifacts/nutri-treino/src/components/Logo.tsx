import { useLocation } from "wouter";

interface LogoProps {
  size?: "sm" | "md";
  variant?: "icon" | "full";
}

export default function Logo({ size = "md", variant = "icon" }: LogoProps) {
  const [, setLocation] = useLocation();

  const iconHeight = size === "sm" ? "h-8" : "h-9";
  const fullHeight = size === "sm" ? "h-7" : "h-8";

  return (
    <button
      onClick={() => setLocation("/")}
      className="hover:opacity-80 transition-opacity flex-shrink-0"
      aria-label="Ir para o início"
    >
      {variant === "full" ? (
        <img
          src="/logo-full.png"
          alt="Evolute"
          className={`${fullHeight} w-auto object-contain`}
        />
      ) : (
        <img
          src="/logo-icon.png"
          alt="Evolute"
          className={`${iconHeight} w-auto object-contain`}
        />
      )}
    </button>
  );
}
