"use client";

import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import ContentCard from "@/components/ui/ContentCard";
import PageHeader from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import type { CompanyBrand, TeamStructure } from "@/lib/api";
import { EMPTY_TEAM_STRUCTURE, newTeamId, parseTeamStructure, sortedGroups, rolesForGroup } from "@/lib/teamStructure";

export default function TeamOrganizationPage() {
  const { request } = useApi();
  const [structure, setStructure] = useState<TeamStructure>(EMPTY_TEAM_STRUCTURE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const brand = await request<CompanyBrand>("/companies/brand");
      setStructure(parseTeamStructure(brand.team_structure));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team structure");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await request<CompanyBrand>("/companies/team-structure", {
        method: "PATCH",
        body: JSON.stringify(structure),
      });
      setSuccess("Team organization saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function addGroup() {
    const sort_order = structure.groups.length;
    setStructure((prev) => ({
      ...prev,
      groups: [
        ...prev.groups,
        { id: newTeamId(), name: "New department", sort_order, color: "#6366f1" },
      ],
    }));
  }

  function addRole(groupId?: string) {
    const rolesInGroup = rolesForGroup(structure, groupId ?? null);
    setStructure((prev) => ({
      ...prev,
      roles: [
        ...prev.roles,
        {
          id: newTeamId(),
          name: "New role",
          group_id: groupId ?? null,
          sort_order: rolesInGroup.length,
          color: "#0ea5e9",
        },
      ],
    }));
  }

  function updateGroup(id: string, patch: Partial<TeamStructure["groups"][0]>) {
    setStructure((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  }

  function updateRole(id: string, patch: Partial<TeamStructure["roles"][0]>) {
    setStructure((prev) => ({
      ...prev,
      roles: prev.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }

  function removeGroup(id: string) {
    setStructure((prev) => ({
      groups: prev.groups.filter((g) => g.id !== id),
      roles: prev.roles.map((r) => (r.group_id === id ? { ...r, group_id: null } : r)),
    }));
  }

  function removeRole(id: string) {
    setStructure((prev) => ({ ...prev, roles: prev.roles.filter((r) => r.id !== id) }));
  }

  function moveGroup(id: string, direction: -1 | 1) {
    const groups = sortedGroups(structure);
    const index = groups.findIndex((g) => g.id === id);
    const target = index + direction;
    if (target < 0 || target >= groups.length) return;
    const reordered = [...groups];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setStructure((prev) => ({
      ...prev,
      groups: reordered.map((g, i) => ({ ...g, sort_order: i })),
    }));
  }

  return (
    <Box>
      <PageHeader
        title="Team organization"
        subtitle="Define departments, roles, and how business cards are grouped — fully customizable by you."
        action={
          <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving…" : "Save organization"}
          </Button>
        }
      />

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Cards are grouped by role on{" "}
        <Link href="/products">Business cards</Link>. Create departments (e.g. Sales, Leadership) and roles (e.g. Account Executive, CEO) in any structure you want.{" "}
        To add employees to your company, go to{" "}
        <Link href="/team/members">Team members</Link>.
      </Alert>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Departments & roles</Typography>
        <Button startIcon={<AddIcon />} onClick={addGroup} disabled={loading}>
          Add department
        </Button>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : structure.groups.length === 0 && structure.roles.length === 0 ? (
        <ContentCard>
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No departments or roles yet. Start by adding a department, then add roles inside it.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={addGroup}>
              Create first department
            </Button>
          </Box>
        </ContentCard>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {sortedGroups(structure).map((group) => (
            <ContentCard key={group.id}>
              <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mb: 2, flexWrap: "wrap" }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 48,
                      borderRadius: 1,
                      bgcolor: group.color || "#6366f1",
                      flexShrink: 0,
                    }}
                  />
                  <TextField
                    label="Department name"
                    value={group.name}
                    onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                    sx={{ flex: 1, minWidth: { xs: "100%", sm: 200 } }}
                  />
                  <TextField
                    label="Description"
                    value={group.description ?? ""}
                    onChange={(e) => updateGroup(group.id, { description: e.target.value })}
                    sx={{ flex: 2, minWidth: { xs: "100%", sm: 220 } }}
                  />
                  <TextField
                    label="Color"
                    value={group.color ?? ""}
                    onChange={(e) => updateGroup(group.id, { color: e.target.value })}
                    sx={{ width: { xs: "100%", sm: 120 } }}
                  />
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton size="small" onClick={() => moveGroup(group.id, -1)} aria-label="Move up">
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => moveGroup(group.id, 1)} aria-label="Move down">
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => removeGroup(group.id)} aria-label="Delete department">
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Roles in {group.name}
                </Typography>
                <Grid container spacing={2}>
                  {rolesForGroup(structure, group.id).map((role) => (
                    <Grid key={role.id} size={{ xs: 12, md: 6 }}>
                      <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                          <TextField
                            label="Role / job title"
                            size="small"
                            fullWidth
                            value={role.name}
                            onChange={(e) => updateRole(role.id, { name: e.target.value })}
                          />
                          <IconButton size="small" color="error" onClick={() => removeRole(role.id)}>
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <TextField
                          label="Description (optional)"
                          size="small"
                          fullWidth
                          value={role.description ?? ""}
                          onChange={(e) => updateRole(role.id, { description: e.target.value })}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Button size="small" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={() => addRole(group.id)}>
                  Add role
                </Button>
              </Box>
            </ContentCard>
          ))}

          <ContentCard title="Roles without department">
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={2}>
                {rolesForGroup(structure, null).map((role) => (
                  <Grid key={role.id} size={{ xs: 12, md: 6 }}>
                    <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                        <TextField
                          label="Role / job title"
                          size="small"
                          fullWidth
                          value={role.name}
                          onChange={(e) => updateRole(role.id, { name: e.target.value })}
                        />
                        <IconButton size="small" color="error" onClick={() => removeRole(role.id)}>
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <TextField
                        label="Description (optional)"
                        size="small"
                        fullWidth
                        value={role.description ?? ""}
                        onChange={(e) => updateRole(role.id, { description: e.target.value })}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <Button size="small" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={() => addRole()}>
                Add standalone role
              </Button>
            </Box>
          </ContentCard>
        </Box>
      )}
    </Box>
  );
}
