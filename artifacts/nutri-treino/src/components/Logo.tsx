import { useLocation } from "wouter";

interface LogoProps {
  size?: "sm" | "md";
}

export default function Logo({ size = "md" }: LogoProps) {
  const [, setLocation] = useLocation();

  const height = size === "sm" ? "h-8" : "h-11";

  return (
    <button
      onClick={() => setLocation("/")}
      className="hover:opacity-80 transition-opacity"
      aria-label="Ir para o início"
    >
      <img
        src="/logo.png"
        alt="Evolute"
        className={`${height} w-auto object-contain`}
      />
    </button>
  );
}
