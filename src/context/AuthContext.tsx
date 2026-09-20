import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, logout as firebaseLogout } from "../lib/firebase";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isGuestDemo?: boolean;
}

interface AuthContextType {
  user: User | AppUser | null;
  loading: boolean;
  authModalOpen: boolean;
  authModalMode: "login" | "signup";
  openAuthModal: (mode?: "login" | "signup") => void;
  closeAuthModal: () => void;
  signOutUser: () => Promise<void>;
  loginAsGuestStudent: (name?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authModalOpen: false,
  authModalMode: "login",
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signOutUser: async () => {},
  loginAsGuestStudent: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | AppUser | null>(() => {
    try {
      const cached = localStorage.getItem("viora_current_student");
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.removeItem("viora_current_student");
      } else {
        // If not in Firebase, check local student session
        try {
          const cached = localStorage.getItem("viora_current_student");
          if (cached) {
            setUser(JSON.parse(cached));
          } else {
            setUser(null);
          }
        } catch (e) {
          setUser(null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openAuthModal = (mode: "login" | "signup" = "login") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const loginAsGuestStudent = (name = "Demo Student") => {
    const localStudent: AppUser = {
      uid: "student_" + Date.now().toString(36),
      email: "student.demo@viora.ai",
      displayName: name,
      photoURL: null,
      isGuestDemo: true,
    };
    try {
      localStorage.setItem("viora_current_student", JSON.stringify(localStudent));
    } catch (e) {}
    setUser(localStudent);
    setAuthModalOpen(false);
  };

  const signOutUser = async () => {
    try {
      localStorage.removeItem("viora_current_student");
    } catch (e) {}
    setUser(null);
    try {
      await firebaseLogout();
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signOutUser,
        loginAsGuestStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
