import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  getDocFromServer,
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { SessionReport } from "../types";
import firebaseAppletConfig from "../../firebase-applet-config.json";

// Provisioned Firebase Configuration from AI Studio
export const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  projectId: firebaseAppletConfig.projectId,
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  appId: firebaseAppletConfig.appId,
  measurementId: firebaseAppletConfig.measurementId || undefined,
};

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Auth & Firestore instances (Using provisioned firestoreDatabaseId if configured)
export const auth = getAuth(app);
export const db =
  firebaseAppletConfig.firestoreDatabaseId &&
  firebaseAppletConfig.firestoreDatabaseId !== "(default)" &&
  !firebaseAppletConfig.firestoreDatabaseId.includes("ai-studio-vioraai")
    ? getFirestore(app, firebaseAppletConfig.firestoreDatabaseId)
    : getFirestore(app);

// Validate connection to Firestore
if (typeof window !== "undefined") {
  (async function testConnection() {
    try {
      await getDocFromServer(doc(db, "test", "connection"));
    } catch (error) {
      if (error instanceof Error && error.message.includes("the client is offline")) {
        console.error("Please check your Firebase configuration.");
      }
    }
  })();
}

export enum OperationType {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Enable local persistence so session is remembered across browser reloads
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Could not set local auth persistence:", err);
  });
}

// Initialize Analytics safely on client side
export let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch((err) => {
      console.warn("Firebase analytics not initialized in this context:", err);
    });
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Sign Up with Email and Password
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  fullName?: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (fullName && fullName.trim()) {
    try {
      await updateProfile(credential.user, {
        displayName: fullName.trim(),
      });
    } catch (e) {
      console.warn("Failed to set display name on new user profile:", e);
    }
  }

  // Also store basic user record in Firestore
  try {
    const userDocRef = doc(db, "users", credential.user.uid);
    await setDoc(
      userDocRef,
      {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: fullName?.trim() || credential.user.displayName || "Learner",
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${credential.user.uid}`);
  }

  return credential.user;
}

/**
 * Sign In with Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return credential.user;
}

/**
 * 1-Click Instant Demo Student Sign In
 * Uses the pre-verified test credentials on this Firebase project or falls back to a seamless local student profile
 */
export async function loginAsDemoStudent(): Promise<User | { uid: string; email: string; displayName: string; photoURL: null; isGuestDemo: boolean }> {
  const demoEmail = "student.demo@viora.ai";
  const demoPass = "VioraDemo2026!";
  try {
    const credential = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
    return credential.user;
  } catch (err: any) {
    if (err?.code === "auth/user-not-found" || err?.code === "auth/invalid-credential") {
      try {
        const reg = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
        try {
          await updateProfile(reg.user, { displayName: "Demo Student" });
        } catch (e) {
          console.warn("Could not set displayName on demo user:", e);
        }
        return reg.user;
      } catch (innerErr: any) {
        console.warn("Firebase email auth creation fallback:", innerErr?.message || innerErr);
      }
    }
    // Return reliable student session object
    return {
      uid: "student_demo_user",
      email: demoEmail,
      displayName: "Demo Student",
      photoURL: null,
      isGuestDemo: true,
    };
  }
}

/**
 * Sign In with Google Popup
 */
export async function loginWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  
  // Sync basic user info to Firestore
  try {
    const userDocRef = doc(db, "users", credential.user.uid);
    await setDoc(
      userDocRef,
      {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName || "Learner",
        photoURL: credential.user.photoURL || null,
        lastLogin: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${credential.user.uid}`);
  }

  return credential.user;
}

/**
 * Reset password via email link
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign Out
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Save practice session to Firestore under current user's profile
 */
export async function saveSessionToFirestore(session: SessionReport, user: { uid: string }): Promise<boolean> {
  const path = `users/${user.uid}/sessions/${session.id}`;
  try {
    const sessionRef = doc(db, "users", user.uid, "sessions", session.id);
    await setDoc(sessionRef, {
      ...session,
      userId: user.uid,
      syncedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Fetch practice sessions from Firestore for the given user
 */
export async function fetchUserSessionsFromFirestore(user: { uid: string }): Promise<SessionReport[]> {
  const path = `users/${user.uid}/sessions`;
  try {
    const sessionsCol = collection(db, "users", user.uid, "sessions");
    const q = query(sessionsCol, orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    const reports: SessionReport[] = [];
    snapshot.forEach((docSnap) => {
      reports.push(docSnap.data() as SessionReport);
    });
    return reports;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}
