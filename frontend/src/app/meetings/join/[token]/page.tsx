"use client";

import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import MeetingNotesBoard from "@/components/meetings/MeetingNotesBoard";
import MeetingParticipantsBar from "@/components/meetings/MeetingParticipantsBar";
import ThemeRegistry from "@/components/ThemeRegistry";
import type { MeetingNotesContent, MeetingRoomState } from "@/lib/api";
import {
  getMeetingRoom,
  joinMeetingRoom,
  meetingHeartbeat,
  updateMeetingNotes,
} from "@/lib/api";
import { APP_NAME } from "@/lib/branding";
import {
  MEETING_POLL_MS,
  loadStoredParticipant,
  saveStoredParticipant,
  type StoredParticipant,
} from "@/lib/meetingRoom";

function JoinForm({
  onJoin,
  loading,
  error,
}: {
  onJoin: (data: { name: string; email: string; company: string }) => void;
  loading: boolean;
  error: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  return (
    <Paper elevation={0} variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, maxWidth: 440, width: "100%", mx: "auto" }}>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <GroupsOutlinedIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Join the meeting
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Enter your name to collaborate on shared notes — no account required.
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          autoFocus
        />
        <TextField
          label="Email (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <TextField
          label="Company (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          fullWidth
        />
        {error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}
        <Button
          variant="contained"
          size="large"
          disabled={loading || !name.trim()}
          onClick={() => onJoin({ name: name.trim(), email: email.trim(), company: company.trim() })}
        >
          {loading ? "Joining…" : "Join meeting room"}
        </Button>
      </Box>
    </Paper>
  );
}

function MeetingRoomContent({ token }: { token: string }) {
  const [participant, setParticipant] = useState<StoredParticipant | null>(null);
  const [room, setRoom] = useState<MeetingRoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState("");
  const [joinError, setJoinError] = useState("");

  const poll = useCallback(async () => {
    const state = await getMeetingRoom(token);
    setRoom(state);
    return state;
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const state = await poll();
        if (!cancelled) {
          const stored = loadStoredParticipant(token);
          if (stored) setParticipant(stored);
          if (state.status === "closed" && stored) {
            setParticipant(stored);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Meeting not found");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, poll]);

  useEffect(() => {
    if (!participant) return;
    const interval = setInterval(() => {
      poll().catch(() => undefined);
      meetingHeartbeat(token, participant.session_id).catch(() => undefined);
    }, MEETING_POLL_MS);
    return () => clearInterval(interval);
  }, [participant, token, poll]);

  const handleJoin = async (data: { name: string; email: string; company: string }) => {
    setJoinLoading(true);
    setJoinError("");
    try {
      const result = await joinMeetingRoom(token, {
        name: data.name,
        email: data.email || undefined,
        company: data.company || undefined,
      });
      const stored: StoredParticipant = {
        session_id: result.session_id,
        name: data.name,
        participant_id: result.participant_id,
      };
      saveStoredParticipant(token, stored);
      setParticipant(stored);
      await poll();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Could not join");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSaveSection = async (section: keyof MeetingNotesContent, content: string) => {
    if (!participant) return;
    await updateMeetingNotes(token, participant.session_id, section, content);
    await poll();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !room) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
        <Typography color="error">{error || "Meeting not found"}</Typography>
      </Paper>
    );
  }

  if (!participant) {
    return <JoinForm onJoin={handleJoin} loading={joinLoading} error={joinError} />;
  }

  const canEdit = room.status !== "closed";

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary">
          {APP_NAME} · Collaborative meeting
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, fontSize: { xs: "1.5rem", sm: "2.125rem" } }}>
          {room.title}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
          <Chip
            label={room.status.toUpperCase()}
            size="small"
            color={room.status === "live" ? "success" : room.status === "closed" ? "warning" : "default"}
          />
          {room.event_tag && <Chip label={room.event_tag} size="small" variant="outlined" />}
          <Chip label={`Joined as ${participant.name}`} size="small" variant="outlined" color="primary" />
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <MeetingParticipantsBar participants={room.participants} />
        </Paper>
        <MeetingNotesBoard
          notes={room.notes}
          notesUpdatedAt={room.notes_updated_at}
          canEdit={canEdit}
          onSaveSection={handleSaveSection}
        />
      </Box>
    </Box>
  );
}

export default function MeetingJoinPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <ThemeRegistry>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          py: { xs: 3, md: 5 },
        }}
      >
        <Container maxWidth="md">
          {token ? (
            <MeetingRoomContent token={token} />
          ) : (
            <Typography sx={{ textAlign: "center" }} color="error">
              Invalid meeting link
            </Typography>
          )}
        </Container>
      </Box>
    </ThemeRegistry>
  );
}
