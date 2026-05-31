"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LinkIcon from "@mui/icons-material/Link";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import SummarizeIcon from "@mui/icons-material/Summarize";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import MeetingNotesBoard from "@/components/meetings/MeetingNotesBoard";
import MeetingParticipantsBar from "@/components/meetings/MeetingParticipantsBar";
import PageHeader from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import type { MeetingNotesContent, MeetingRoomState, MeetingSessionDetail } from "@/lib/api";
import { getMeetingRoom, joinMeetingRoom, meetingJoinUrl, meetingHeartbeat, updateMeetingNotes } from "@/lib/api";
import { MEETING_POLL_MS, loadStoredParticipant, saveStoredParticipant } from "@/lib/meetingRoom";

const STATUS_COLORS: Record<string, "default" | "success" | "warning"> = {
  draft: "default",
  live: "success",
  closed: "warning",
};

function formatWhen(iso: string | null) {
  if (!iso) return "Not scheduled";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MeetingHostPage({ meetingId }: { meetingId: number }) {
  const { request } = useApi();
  const router = useRouter();
  const [session, setSession] = useState<MeetingSessionDetail | null>(null);
  const [room, setRoom] = useState<MeetingRoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [copied, setCopied] = useState(false);

  const loadSession = useCallback(async () => {
    const data = await request<MeetingSessionDetail>(`/meetings/sessions/${meetingId}`);
    setSession(data);
    return data;
  }, [request, meetingId]);

  const pollRoom = useCallback(async (token: string) => {
    const state = await getMeetingRoom(token);
    setRoom(state);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await loadSession();
        if (!cancelled) {
          await pollRoom(data.share_token);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load meeting");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSession, pollRoom]);

  useEffect(() => {
    if (!session?.share_token) return;
    const interval = setInterval(() => {
      pollRoom(session.share_token).catch(() => undefined);
    }, MEETING_POLL_MS);
    return () => clearInterval(interval);
  }, [session?.share_token, pollRoom]);

  const joinUrl = session ? meetingJoinUrl(session.share_token) : "";

  const copyLink = async () => {
    if (!joinUrl) return;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
  };

  const updateStatus = async (status: "live" | "closed") => {
    if (!session) return;
    setActionLoading(status);
    try {
      const updated = await request<MeetingSessionDetail>(`/meetings/sessions/${meetingId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setSession(updated);
      await pollRoom(updated.share_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update meeting");
    } finally {
      setActionLoading("");
    }
  };

  const generateReport = async () => {
    setActionLoading("report");
    try {
      await request(`/meetings/sessions/${meetingId}/report`, { method: "POST" });
      router.push(`/meetings/${meetingId}/report`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setActionLoading("");
    }
  };

  const handleSaveSection = async (section: keyof MeetingNotesContent, content: string) => {
    if (!session) return;
    let stored = loadStoredParticipant(session.share_token);
    if (!stored) {
      const join = await joinMeetingRoom(session.share_token, { name: session.host_name });
      stored = {
        session_id: join.session_id,
        name: session.host_name,
        participant_id: join.participant_id,
      };
      saveStoredParticipant(session.share_token, stored);
    }
    await updateMeetingNotes(session.share_token, stored.session_id, section, content);
    await pollRoom(session.share_token);
  };

  useEffect(() => {
    if (!session?.share_token) return;
    const stored = loadStoredParticipant(session.share_token);
    if (!stored) return;
    const tick = () => {
      meetingHeartbeat(session.share_token, stored.session_id).catch(() => undefined);
    };
    tick();
    const interval = setInterval(tick, MEETING_POLL_MS);
    return () => clearInterval(interval);
  }, [session?.share_token]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return <Alert severity="error">{error || "Meeting not found"}</Alert>;
  }

  const canEdit = session.status !== "closed";
  const notes = room?.notes ?? session.notes;
  const participants = room?.participants ?? [];

  return (
    <Box>
      <PageHeader
        title={session.title}
        subtitle={`Hosted by ${session.host_name} · ${formatWhen(session.scheduled_at)}`}
        action={
          <Button component={Link} href="/meetings" variant="text">
            Back to meetings
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", mb: 2 }}>
          <Chip label={session.status.toUpperCase()} color={STATUS_COLORS[session.status]} size="small" />
          {session.event_tag && <Chip label={session.event_tag} size="small" variant="outlined" />}
          <Chip
            icon={<GroupsOutlinedIcon />}
            label={`${participants.length} participants`}
            size="small"
            variant="outlined"
          />
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={copyLink}
          >
            Copy join link
          </Button>
          <Button
            variant="outlined"
            startIcon={<LinkIcon />}
            component="a"
            href={joinUrl}
            target="_blank"
            rel="noopener"
          >
            Open room
          </Button>
          {session.status === "draft" && (
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={() => updateStatus("live")}
              disabled={!!actionLoading}
            >
              Go live
            </Button>
          )}
          {session.status === "live" && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<StopIcon />}
              onClick={() => updateStatus("closed")}
              disabled={!!actionLoading}
            >
              End meeting
            </Button>
          )}
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SummarizeIcon />}
            onClick={generateReport}
            disabled={!!actionLoading}
          >
            Generate report
          </Button>
          {session.has_report && (
            <Button component={Link} href={`/meetings/${meetingId}/report`} variant="text">
              View report
            </Button>
          )}
        </Box>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "280px 1fr" },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, position: { lg: "sticky" }, top: 24 }}>
          <MeetingParticipantsBar participants={participants} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
            Updates every {MEETING_POLL_MS / 1000}s — no account needed for guests.
          </Typography>
        </Paper>
        <MeetingNotesBoard
          notes={notes}
          notesUpdatedAt={room?.notes_updated_at ?? session.notes_updated_at}
          canEdit={canEdit}
          onSaveSection={handleSaveSection}
        />
      </Box>

      <Snackbar open={copied} autoHideDuration={2500} onClose={() => setCopied(false)} message="Join link copied!" />
    </Box>
  );
}
