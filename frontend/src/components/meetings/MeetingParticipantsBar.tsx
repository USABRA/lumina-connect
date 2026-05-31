"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

import UserAvatar from "@/components/UserAvatar";
import type { MeetingParticipantInfo } from "@/lib/api";

export default function MeetingParticipantsBar({
  participants,
}: {
  participants: MeetingParticipantInfo[];
}) {
  const active = participants.filter((p) => p.is_active);
  const others = participants.filter((p) => !p.is_active);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        Participants ({participants.length})
      </Typography>
      {participants.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Waiting for people to join…
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {active.map((p) => (
            <Chip
              key={p.id}
              avatar={<UserAvatar name={p.name} size={28} />}
              label={p.name}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 36, "& .MuiChip-label": { fontWeight: 600 } }}
            />
          ))}
          {others.map((p) => (
            <Chip
              key={p.id}
              avatar={<UserAvatar name={p.name} size={28} sx={{ opacity: 0.6 }} />}
              label={p.name}
              size="small"
              variant="outlined"
              sx={{ height: 36, opacity: 0.7 }}
            />
          ))}
        </Box>
      )}
      {active.length > 0 && (
        <Typography variant="caption" color="success.main" sx={{ mt: 1, display: "block" }}>
          {active.length} active now
        </Typography>
      )}
    </Box>
  );
}
