"use client";

import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import ContentCard from "@/components/ui/ContentCard";
import PageHeader from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import type { CompanyMember, CompanyMemberCreateResponse } from "@/lib/api";
import { isAdmin } from "@/lib/permissions";
import { useAuth } from "@/contexts/AuthContext";

export default function TeamMembersPage() {
  const { request } = useApi();
  const { profile } = useAuth();
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createResult, setCreateResult] = useState<CompanyMemberCreateResponse | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "company_user">("company_user");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await request<CompanyMember[]>("/companies/members");
      setMembers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team members");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (profile && isAdmin(profile.user.role)) {
      load();
    } else {
      setLoading(false);
    }
  }, [load, profile]);

  function openDialog() {
    setCreateResult(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("company_user");
    setDialogOpen(true);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, string> = { name, email, role };
      if (password.trim()) body.password = password.trim();
      const created = await request<CompanyMemberCreateResponse>("/companies/members", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setCreateResult(created);
      setDialogOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box>
      <PageHeader
        title="Team members"
        subtitle="Add employees to your company so you can assign business cards and track performance."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openDialog}>
            Add member
          </Button>
        }
      />

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The first person who registers your company becomes an <strong>admin</strong>. Admins can add
        members here and manage cards on{" "}
        <Link href="/products">Business cards</Link>. Configure departments on{" "}
        <Link href="/team">Team organization</Link>.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {createResult && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setCreateResult(null)}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {createResult.name} added ({createResult.email})
          </Typography>
          {createResult.temporary_password && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Temporary password: <strong>{createResult.temporary_password}</strong>
            </Typography>
          )}
          {createResult.login_hint && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {createResult.login_hint}
            </Typography>
          )}
        </Alert>
      )}

      <ContentCard>
        {loading ? (
          <Typography color="text.secondary" sx={{ p: 2 }}>
            Loading…
          </Typography>
        ) : members.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No team members yet.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openDialog}>
              Add first member
            </Button>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={member.role === "admin" ? "Admin" : "Member"}
                      color={member.role === "admin" ? "primary" : "default"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ContentCard>

      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleCreate}>
          <DialogTitle>Add team member</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Full name"
              required
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Email"
              type="email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel id="member-role-label">Role</InputLabel>
              <Select
                labelId="member-role-label"
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "company_user")}
              >
                <MenuItem value="company_user">Member (employee)</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Password (optional with Firebase)"
              type="password"
              fullWidth
              helperText="Leave empty to auto-generate a temporary password (Firebase). Required in local auth mode."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Adding…" : "Add member"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
