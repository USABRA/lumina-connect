"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";

import type { MeetingNotesContent } from "@/lib/api";
import { MEETING_NOTE_SECTIONS } from "@/lib/api";

type Props = {
  notes: MeetingNotesContent;
  notesUpdatedAt: string | null;
  canEdit: boolean;
  onSaveSection: (section: keyof MeetingNotesContent, content: string) => Promise<void>;
};

export default function MeetingNotesBoard({ notes, notesUpdatedAt, canEdit, onSaveSection }: Props) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [saving, setSaving] = useState<string | null>(null);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes, notesUpdatedAt]);

  const scheduleSave = useCallback(
    (section: keyof MeetingNotesContent, content: string) => {
      if (debounceRef.current[section]) {
        clearTimeout(debounceRef.current[section]);
      }
      debounceRef.current[section] = setTimeout(async () => {
        setSaving(section);
        try {
          await onSaveSection(section, content);
        } finally {
          setSaving(null);
        }
      }, 800);
    },
    [onSaveSection]
  );

  const handleChange = (section: keyof MeetingNotesContent, value: string) => {
    setLocalNotes((prev) => ({ ...prev, [section]: value }));
    if (canEdit) {
      scheduleSave(section, value);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {MEETING_NOTE_SECTIONS.map(({ key, label }) => (
        <Paper
          key={key}
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            transition: "box-shadow 0.2s",
            "&:focus-within": canEdit
              ? { boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.25)" }
              : undefined,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {label}
            </Typography>
            {saving === key && (
              <Typography variant="caption" color="text.secondary">
                Saving…
              </Typography>
            )}
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={12}
            value={localNotes[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            disabled={!canEdit}
            placeholder={canEdit ? "Everyone in the room can edit this section…" : "Meeting ended — notes are read-only"}
            variant="standard"
            slotProps={{
              input: {
                disableUnderline: true,
                sx: { fontSize: "0.95rem", lineHeight: 1.6 },
              },
            }}
          />
        </Paper>
      ))}
    </Box>
  );
}
