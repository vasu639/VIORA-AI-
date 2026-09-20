import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, ChevronDown } from "lucide-react";
import { useTheme, ThemeMode } from "../context/ThemeContext";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
  variant?: "toggle" | "dropdown";
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  className = "",
  variant = "toggle",
}) => {
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  if (variant === "dropdown") {
    return (
      <div className={`relative ${className}`} ref={containerRef}>
        <button
          id="theme-select-dropdown-btn"
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Current theme: ${theme}`}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-blue-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
          {showLabel && (
            <span className="capitalize hidden sm:inline">{theme}</span>
          )}
          <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                setTheme("light");
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                theme === "light"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-[#2F6FED] font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme("dark");
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                theme === "dark"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-[#2F6FED] font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-blue-400" />
              <span>Dark</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme("system");
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                theme === "system"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-[#2F6FED] font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-slate-400" />
              <span>System</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Quick 1-click toggle button
  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-2xs transition-all flex items-center gap-1.5 ${className}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300 animate-in spin-in-180 duration-200" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
};
