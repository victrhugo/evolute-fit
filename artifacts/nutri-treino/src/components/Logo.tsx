import { useLocation } from "wouter";

interface LogoProps {
  size?: "sm" | "md";
}

export default function Logo({ size = "md" }: LogoProps) {
  const [, setLocation] = useLocation();

  const circleSize = size === "sm" ? "w-5 h-5" : "w-7 h-7";
  const textSize = size === "sm" ? "text-[10px]" : "text-sm";
  const labelSize = size === "sm" ? "text-sm" : "text-lg";

  return (
    <button
      onClick={() => setLocation("/")}
      className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
      aria-label="Ir para o início"
    >
      <div className={`${circleSize} rounded-full bg-primary flex items-center justify-center shrink-0`}>
        <span className={`font-extrabold ${textSize} text-primary-foreground leading-none`}>E</span>
      </div>
      <span className={`font-bold ${labelSize} tracking-tight`}>Evolute</span>
    </button>
  );
}
