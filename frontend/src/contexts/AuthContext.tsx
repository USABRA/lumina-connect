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

import {
  getMe,
  loginUser,
  registerUser,
  syncUser,
  updateCompanyBrand,
  uploadImage,
  type UserProfile,
} from "@/lib/api";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/auth-token";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type AuthContextValue = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  firebaseReady: boolean;
  isAuthenticated: boolean;
  getAccessToken: () => Promise<string | undefined>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
    brandColor?: string;
    brandLogoFile?: File | null;
  }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapFirebaseError(error: unknown): string {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "";

  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password";
    case "auth/email-already-in-use":
      return "An account with this email already exists";
    case "auth/weak-password":
      return "Password must be at least 6 characters";
    case "auth/invalid-email":
      return "Enter a valid email address";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return error instanceof Error ? error.message : "Authentication failed";
  }
}

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
  const isAuthenticated = Boolean(firebaseUser || profile);

  const getAccessToken = useCallback(async (): Promise<string | undefined> => {
    if (firebaseUser) {
      return firebaseUser.getIdToken();
    }
    // When Firebase is configured, never send stale local JWT tokens to the API.
    if (firebaseReady) {
      return undefined;
    }
    return getStoredToken() ?? undefined;
  }, [firebaseUser, firebaseReady]);

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

    const token = getStoredToken();
    if (token) {
      const next = await getMe(token);
      setProfile(next);
    }
  }, [firebaseUser]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      const token = getStoredToken();
      if (token) {
        getMe(token)
          .then(setProfile)
          .catch(() => {
            clearStoredToken();
            setProfile(null);
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        clearStoredToken();
        setProfile(null);
        setLoading(false);
        return;
      }

      // Resolve auth gate immediately; profile fetch must not block the dashboard shell
      // (Render cold starts can take 30–90s and previously caused an infinite spinner).
      setLoading(false);

      void (async () => {
        try {
          const next = await loadProfile(user);
          setProfile(next);
        } catch {
          setProfile(null);
        }
      })();
    });

    return unsubscribe;
  }, [firebaseReady]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const auth = getFirebaseAuth();
      if (auth) {
        try {
          const credential = await signInWithEmailAndPassword(auth, email, password);
          const next = await loadProfile(credential.user);
          setProfile(next);
          router.push("/dashboard");
          return;
        } catch (error) {
          throw new Error(mapFirebaseError(error));
        }
      }

      try {
        const result = await loginUser({ email, password });
        setStoredToken(result.access_token);
        setProfile({ user: result.user, company: result.company });
        router.push("/dashboard");
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Login failed");
      }
    },
    [router]
  );

  const signUp = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      companyName: string;
      brandColor?: string;
      brandLogoFile?: File | null;
    }) => {
      const brandColor = data.brandColor?.trim() || undefined;

      const applyBrandFields = async (
        token: string,
        company: UserProfile["company"]
      ): Promise<UserProfile["company"]> => {
        let brandLogoUrl = company?.brand_logo_url ?? undefined;
        if (data.brandLogoFile) {
          brandLogoUrl = await uploadImage(data.brandLogoFile, token);
        }
        if (brandLogoUrl || brandColor) {
          const updated = await updateCompanyBrand(token, {
            brand_logo_url: brandLogoUrl ?? null,
            brand_color: brandColor ?? null,
          });
          return updated;
        }
        return company;
      };

      const auth = getFirebaseAuth();
      if (auth) {
        try {
          const credential = await createUserWithEmailAndPassword(
            auth,
            data.email,
            data.password
          );
          await firebaseUpdateProfile(credential.user, { displayName: data.name });

          const token = await credential.user.getIdToken();
          const synced = await syncUser(token, {
            name: data.name,
            company_name: data.companyName,
            brand_color: brandColor ?? null,
          });
          const company = await applyBrandFields(token, synced.company);
          setProfile({ ...synced, company });
          router.push("/dashboard");
          return;
        } catch (error) {
          throw new Error(mapFirebaseError(error));
        }
      }

      try {
        const result = await registerUser({
          name: data.name,
          email: data.email,
          password: data.password,
          company_name: data.companyName,
          brand_color: brandColor ?? null,
        });
        const company = await applyBrandFields(result.access_token, result.company);
        setStoredToken(result.access_token);
        setProfile({ user: result.user, company, is_platform_admin: result.is_platform_admin });
        router.push("/dashboard");
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Registration failed");
      }
    },
    [router]
  );

  const resetPassword = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Password reset requires Firebase configuration");
    await sendPasswordResetEmail(auth, email);
  }, []);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
    clearStoredToken();
    setProfile(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      loading,
      firebaseReady,
      isAuthenticated,
      getAccessToken,
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
      isAuthenticated,
      getAccessToken,
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
