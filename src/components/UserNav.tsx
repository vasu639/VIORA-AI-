import React, { useState, useRef, useEffect } from "react";
import { User, LogOut, History, TrendingUp, ChevronDown, Sparkles, Sun, Moon, Monitor } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface UserNavProps {
  onOpenHistory: () => void;
  onOpenImprovementReport?: () => void;
}

export const UserNav: React.FC<UserNavProps> = ({
  onOpenHistory,
  onOpenImprovementReport,
}) => {
  const { user, loading, openAuthModal, signOutUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
    );
  }

  // Not logged in: Show Log In & Create Account buttons
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          id="nav-login-btn"
          type="button"
          onClick={() => openAuthModal("login")}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#0B1A33] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          Log In
        </button>
        <button
          id="nav-signup-btn"
          type="button"
          onClick={() => openAuthModal("signup")}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#0B1A33] to-[#2F6FED] hover:opacity-95 rounded-lg shadow-xs hover:shadow-sm transition-all"
        >
          <Sparkles className="w-3 h-3 text-blue-200" />
          <span>Create Account</span>
        </button>
      </div>
    );
  }

  // Logged In: Show User Profile Avatar & Dropdown
  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="user-profile-menu-btn"
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all focus:outline-hidden"
        title="User profile and account settings"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={displayName}
            className="w-7 h-7 rounded-full object-cover border border-blue-100 dark:border-blue-900"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0B1A33] to-[#2F6FED] text-white text-[11px] font-bold flex items-center justify-center shadow-2xs">
            {initials}
          </div>
        )}
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] sm:max-w-[130px] truncate hidden xs:inline">
          {displayName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
      </button>

      {/* Profile Dropdown */}
      {dropdownOpen && (
        <div
          id="user-profile-dropdown"
          className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* User Details */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="w-9 h-9 rounded-full object-cover border border-blue-200 dark:border-blue-800"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0B1A33] to-[#2F6FED] text-white text-xs font-bold flex items-center justify-center">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#0B1A33] dark:text-white truncate">{displayName}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">{user.email}</p>
              </div>
            </div>

            {/* Cloud Connected Badge */}
            <div className="mt-2.5 flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Firebase Cloud Connected</span>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            {onOpenImprovementReport && (
              <button
                id="dropdown-improvement-btn"
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenImprovementReport();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-[#2F6FED] dark:hover:text-blue-400 transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-[#2F6FED]" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Improvement Report</span>
              </button>
            )}

            <button
              id="dropdown-history-btn"
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                onOpenHistory();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0B1A33] dark:hover:text-white transition-colors"
            >
              <History className="w-4 h-4 text-slate-400" />
              <span>My Assessment History</span>
            </button>
          </div>

          {/* Theme Selector inside profile */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Theme Mode
            </span>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  theme === "light"
                    ? "bg-white dark:bg-slate-700 text-[#0B1A33] dark:text-white shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Sun className="w-3 h-3 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  theme === "dark"
                    ? "bg-white dark:bg-slate-700 text-[#0B1A33] dark:text-white shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Moon className="w-3 h-3 text-blue-400" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  theme === "system"
                    ? "bg-white dark:bg-slate-700 text-[#0B1A33] dark:text-white shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Monitor className="w-3 h-3 text-slate-400" />
                <span>Auto</span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
            <button
              id="dropdown-signout-btn"
              type="button"
              onClick={async () => {
                setDropdownOpen(false);
                await signOutUser();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

