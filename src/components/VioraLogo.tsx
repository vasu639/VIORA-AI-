import React from "react";

interface VioraLogoProps {
  variant?: "mark" | "full" | "horizontal";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  showSubtitle?: boolean;
}

export const VioraLogo: React.FC<VioraLogoProps> = ({
  variant = "horizontal",
  size = "md",
  className = "",
  showSubtitle = true,
}) => {
  // Size mappings
  const markSizeMap = {
    xs: "w-7 h-7",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
    hero: "w-28 h-28 sm:w-32 sm:h-32",
  };

  const fullSizeMap = {
    xs: "w-16 h-16",
    sm: "w-24 h-24",
    md: "w-36 h-36",
    lg: "w-48 h-48",
    xl: "w-64 h-64",
    hero: "w-72 h-72 sm:w-80 sm:h-80",
  };

  if (variant === "full") {
    return (
      <div className={`relative inline-block ${fullSizeMap[size]} ${className}`}>
        <img
          src="/viora-logo.svg"
          alt="Viora AI Official Logo"
          className="w-full h-full object-contain drop-shadow-md hover:scale-[1.02] transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (variant === "mark") {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl overflow-hidden shadow-sm ${markSizeMap[size]} ${className}`}
      >
        <img
          src="/viora-mark.svg"
          alt="Viora AI Mark"
          className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Horizontal Brand Lockup (Default for Navbar & Headers)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 3D Ribbon Icon Tile */}
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-2xs ${markSizeMap[size]}`}
      >
        <img
          src="/viora-mark.svg"
          alt="Viora AI Logo Mark"
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Styled Wordmark matching official VIORA typography */}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-xl text-[#0B1A33] dark:text-white tracking-[0.14em] leading-none uppercase">
            Vior<span className="font-black">a</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F6FED] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/60">
            AI
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-0.5">
            Oral Viva & Interview Practice
          </p>
        )}
      </div>
    </div>
  );
};
