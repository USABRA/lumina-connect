"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import AuthCard from "@/components/auth/AuthCard";
import FirebaseSetupAlert from "@/components/auth/FirebaseSetupAlert";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { signIn, firebaseUser, loading, firebaseReady } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && firebaseUser) {
      router.replace("/dashboard");
    }
  }, [loading, firebaseUser, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Sign in" subtitle="NFC business cards, lead capture, and networking analytics">
      <FirebaseSetupAlert />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          required
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={submitting || !firebaseReady}
          sx={{ mt: 2 }}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </Box>
      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        <Link component={NextLink} href="/reset-password" underline="hover">
          Forgot password?
        </Link>
        <Link component={NextLink} href="/register" underline="hover">
          Create an account
        </Link>
      </Box>
    </AuthCard>
  );
}
