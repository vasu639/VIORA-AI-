import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Landing } from "./pages/Landing";
import { Viva } from "./pages/Viva";
import { Interview } from "./pages/Interview";
import { ResultsSummary } from "./components/ResultsSummary";
import { HistoryModal } from "./components/HistoryModal";
import { ImprovementReportModal } from "./components/ImprovementReportModal";
import { AuthModal } from "./components/AuthModal";
import { AuthScreen } from "./components/AuthScreen";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AssessmentMode, SessionReport } from "./types";
import { getSavedSessions, saveSessionToStorage } from "./lib/storage";
import { fetchUserSessionsFromFirestore } from "./lib/firebase";
import { VioraLogo } from "./components/VioraLogo";

function AppContent() {
  const { user, loading } = useAuth();
  const [currentMode, setCurrentMode] = useState<AssessmentMode | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [improvementOpen, setImprovementOpen] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SessionReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SessionReport | null>(null);

  const refreshHistory = () => {
    const sessions = getSavedSessions();
    setSavedSessions(sessions);
  };

  // Initial local load
  useEffect(() => {
    refreshHistory();
  }, []);

  // When user logs in with Firebase, fetch their cloud sessions and merge
  useEffect(() => {
    if (user) {
      fetchUserSessionsFromFirestore(user).then((cloudSessions) => {
        if (cloudSessions.length > 0) {
          const local = getSavedSessions();
          // Merge by id
          const map = new Map<string, SessionReport>();
          local.forEach((s) => map.set(s.id, s));
          cloudSessions.forEach((s) => map.set(s.id, s));
          const merged = Array.from(map.values()).sort(
            (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
          );
          // Update storage & state
          merged.slice(0, 30).forEach((s) => saveSessionToStorage(s));
          setSavedSessions(merged);
        }
      });
    }
  }, [user]);

  const handleSelectMode = (mode: AssessmentMode | null) => {
    setSelectedReport(null);
    setCurrentMode(mode);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSessionComplete = (session: SessionReport) => {
    refreshHistory();
  };

  const handleOpenReportFromHistory = (session: SessionReport) => {
    setSelectedReport(session);
    setCurrentMode(session.mode);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // While checking Firebase Auth status
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F8FC] dark:bg-[#0B1329] p-4 text-center transition-colors">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <VioraLogo variant="mark" size="lg" />
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#0B1A33] dark:text-white">Viora AI</h3>
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <div className="w-3.5 h-3.5 border-2 border-[#2F6FED] border-t-transparent rounded-full animate-spin" />
              <span>Verifying authentication status...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mandatory Authentication Gate: Disallow access to the app until authentication is done
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FC] dark:bg-[#0B1329] text-[#16233C] dark:text-slate-100 antialiased selection:bg-blue-100 selection:text-[#2F6FED] transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenImprovementReport={() => setImprovementOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {selectedReport ? (
          <ResultsSummary
            session={selectedReport}
            onRetake={() => {
              setSelectedReport(null);
              // Keeps the mode so user can run fresh assessment
            }}
            onStartNew={() => {
              setSelectedReport(null);
              setCurrentMode(null);
            }}
            onOpenImprovementReport={() => setImprovementOpen(true)}
          />
        ) : currentMode === "viva" ? (
          <Viva
            onBackToHome={() => handleSelectMode(null)}
            onSessionComplete={handleSessionComplete}
          />
        ) : currentMode === "interview" ? (
          <Interview
            onBackToHome={() => handleSelectMode(null)}
            onSessionComplete={handleSessionComplete}
          />
        ) : (
          <Landing
            onStartMode={handleSelectMode}
            onOpenHistory={() => setHistoryOpen(true)}
            onOpenImprovementReport={() => setImprovementOpen(true)}
            pastSessionCount={savedSessions.length}
          />
        )}
      </main>

      {/* Past Sessions Modal */}
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={savedSessions}
        onSelectSession={handleOpenReportFromHistory}
        onRefresh={refreshHistory}
        onOpenImprovementReport={() => setImprovementOpen(true)}
      />

      {/* Full Improvement Report Modal */}
      <ImprovementReportModal
        isOpen={improvementOpen}
        onClose={() => setImprovementOpen(false)}
        sessions={savedSessions}
        onSelectSession={handleOpenReportFromHistory}
      />

      {/* Firebase Authentication Modal (Login / Create Account / Reset) */}
      <AuthModal />

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <VioraLogo variant="mark" size="xs" />
            <span className="font-bold text-[#0B1A33] dark:text-white">Viora AI</span>
            <span>—</span>
            <span>AI Oral Examination & Mock Interview Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
            <span>Harsh & Vasu</span>
            <span>•</span>
            <span>Powered by Gemini 3.8 Flash</span>
            <span>•</span>
            <span>Voice & Vision Coaching</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

