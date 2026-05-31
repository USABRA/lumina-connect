"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import NextLink from "next/link";
import { FormEvent, useState } from "react";

import AuthCard from "@/components/auth/AuthCard";
import FirebaseSetupAlert from "@/components/auth/FirebaseSetupAlert";
import { useAuth } from "@/contexts/AuthContext";

export default function ResetPasswordPage() {
  const { resetPassword, firebaseReady } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle="We'll email you a link to reset your password"
    >
      <FirebaseSetupAlert />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Check your inbox for the reset link.
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
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={submitting || !firebaseReady}
          sx={{ mt: 2 }}
        >
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Link component={NextLink} href="/login" underline="hover">
          Back to sign in
        </Link>
      </Box>
    </AuthCard>
  );
}
