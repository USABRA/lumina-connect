"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as firebaseUpdateProfile,
  type User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getMe, syncUser, type UserProfile } from "@/lib/api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type AuthContextValue = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  firebaseReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(user: User): Promise<UserProfile> {
  const token = await user.getIdToken();
  try {
    return await getMe(token);
  } catch {
    return syncUser(token, {
      name: user.displayName || user.email?.split("@")[0] || "User",
    });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const firebaseReady = isFirebaseConfigured();

  const refreshProfile = useCallback(async () => {
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken();
      const next = await getMe(token);
      setProfile(next);
      if (next.user.name && firebaseUser.displayName !== next.user.name) {
        await firebaseUpdateProfile(firebaseUser, { displayName: next.user.name });
      }
      if (next.user.avatar_url && firebaseUser.photoURL !== next.user.avatar_url) {
        await firebaseUpdateProfile(firebaseUser, { photoURL: next.user.avatar_url });
      }
      return;
    }
    if (!firebaseReady) {
      const next = await getMe();
      setProfile(next);
    }
  }, [firebaseUser, firebaseReady]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      getMe()
        .then(setProfile)
        .catch(() => setProfile(null))
        .finally(() => setLoading(false));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const next = await loadProfile(user);
          setProfile(next);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [firebaseReady]);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase is not configured");
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const next = await loadProfile(credential.user);
    setProfile(next);
    router.push("/");
  }, [router]);

  const signUp = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      companyName: string;
    }) => {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase is not configured");

      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      await firebaseUpdateProfile(credential.user, { displayName: data.name });

      const token = await credential.user.getIdToken();
      const next = await syncUser(token, {
        name: data.name,
        company_name: data.companyName,
      });
      setProfile(next);
      router.push("/");
    },
    [router]
  );

  const resetPassword = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase is not configured");
    await sendPasswordResetEmail(auth, email);
  }, []);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
    setProfile(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      loading,
      firebaseReady,
      signIn,
      signUp,
      resetPassword,
      logout,
      refreshProfile,
    }),
    [
      firebaseUser,
      profile,
      loading,
      firebaseReady,
      signIn,
      signUp,
      resetPassword,
      logout,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
