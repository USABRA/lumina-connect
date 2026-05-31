"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import { useCallback, useEffect, useState } from "react";

import ContentCard from "@/components/ui/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";

import { useApi } from "@/hooks/useApi";
import type { Campaign } from "@/lib/api";

type FormState = {
  name: string;
  start_date: string;
  end_date: string;
};

const emptyForm: FormState = { name: "", start_date: "", end_date: "" };

export default function CampaignsPage() {
  const { request } = useApi();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request<Campaign[]>("/campaigns");
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(campaign: Campaign) {
    setEditing(campaign);
    setForm({
      name: campaign.name,
      start_date: campaign.start_date ?? "",
      end_date: campaign.end_date ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      if (editing) {
        await request(`/campaigns/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await request("/campaigns", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(campaign: Campaign) {
    if (!confirm(`Delete campaign "${campaign.name}" and all its products?`)) return;
    setError("");
    try {
      await request(`/campaigns/${campaign.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete campaign");
    }
  }

  return (
    <Box>
      <PageHeader
        title="Campaigns"
        subtitle="Organize trade shows, promos, and product launches in one place."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New campaign
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <ContentCard noPadding>
        <TableContainer>
          <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell align="right">Products</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>Loading…</TableCell>
              </TableRow>
            ) : campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ border: 0 }}>
                  <EmptyState
                    icon={CampaignOutlinedIcon}
                    title="No campaigns yet"
                    description="Create your first campaign to start tracking physical products."
                    action={
                      <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                        New campaign
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign.id} hover>
                  <TableCell>{campaign.name}</TableCell>
                  <TableCell>{campaign.start_date ?? "—"}</TableCell>
                  <TableCell>{campaign.end_date ?? "—"}</TableCell>
                  <TableCell align="right">{campaign.product_count}</TableCell>
                  <TableCell align="right">
                    <IconButton aria-label="edit" size="small" onClick={() => openEdit(campaign)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton aria-label="delete" size="small" onClick={() => handleDelete(campaign)}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </TableContainer>
      </ContentCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Edit campaign" : "New campaign"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Campaign name"
            fullWidth
            required
            margin="normal"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Lumina Precision"
          />
          <TextField
            label="Start date"
            type="date"
            fullWidth
            margin="normal"
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
          <TextField
            label="End date"
            type="date"
            fullWidth
            margin="normal"
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
