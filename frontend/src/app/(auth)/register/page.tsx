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

export default function RegisterPage() {
  const { signUp, firebaseUser, loading, firebaseReady } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && firebaseUser) {
      router.replace("/");
    }
  }, [loading, firebaseUser, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signUp({ name, email, password, companyName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Create account" subtitle="Start tracking your physical products">
      <FirebaseSetupAlert />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Full name"
          fullWidth
          required
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Company name"
          fullWidth
          required
          margin="normal"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
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
          helperText="At least 6 characters"
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
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Link component={NextLink} href="/login" underline="hover">
          Already have an account? Sign in
        </Link>
      </Box>
    </AuthCard>
  );
}
