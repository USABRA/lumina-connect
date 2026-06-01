"use client";

import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useFullScreenDialog } from "@/hooks/useFullScreenDialog";
import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onSubmit: (data: {
    title: string;
    scheduled_at?: string;
    event_tag?: string;
  }) => Promise<void>;
};

export default function NewMeetingDialog({ open, onClose, onCreated, onSubmit }: Props) {
  const fullScreen = useFullScreenDialog();
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [eventTag, setEventTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        event_tag: eventTag.trim() || undefined,
      });
      setTitle("");
      setScheduledAt("");
      setEventTag("");
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <GroupsOutlinedIcon color="primary" />
        New collaborative meeting
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Meeting title"
            placeholder="Q2 planning sync"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            autoFocus
          />
          <TextField
            label="Date & time"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Event tag (optional)"
            placeholder="expo-2026"
            value={eventTag}
            onChange={(e) => setEventTag(e.target.value)}
            fullWidth
          />
          {error && (
            <Chip label={error} color="error" size="small" sx={{ alignSelf: "flex-start" }} />
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          Create & get link
        </Button>
      </DialogActions>
    </Dialog>
  );
}
