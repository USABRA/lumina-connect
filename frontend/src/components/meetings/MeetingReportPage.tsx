"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import PageHeader from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import type { MeetingReportDetail } from "@/lib/api";

export default function MeetingReportPage({ meetingId }: { meetingId: number }) {
  const { request } = useApi();
  const [report, setReport] = useState<MeetingReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request<MeetingReportDetail>(`/meetings/sessions/${meetingId}/report`);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [request, meetingId]);

  useEffect(() => {
    load();
  }, [load]);

  const copyMarkdown = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report.content_markdown);
    setCopied(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!report) {
    return (
      <Box>
        <PageHeader title="Meeting report" subtitle="No report available yet" />
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {error || "Generate a report from the meeting room first."}
        </Alert>
        <Button component={Link} href={`/meetings/${meetingId}`} sx={{ mt: 2 }}>
          Back to meeting
        </Button>
      </Box>
    );
  }

  const title =
    typeof report.content_json.title === "string" ? report.content_json.title : "Meeting report";

  return (
    <Box>
      <PageHeader
        title={title}
        subtitle={`Generated ${new Date(report.generated_at).toLocaleString()}`}
        action={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={copyMarkdown}>
              Copy markdown
            </Button>
            <Button component={Link} href={`/meetings/${meetingId}`} variant="text">
              Back to meeting
            </Button>
          </Box>
        }
      />

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: 2,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "0.875rem",
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          bgcolor: "grey.50",
        }}
      >
        <Typography component="pre" sx={{ m: 0, font: "inherit", whiteSpace: "pre-wrap" }}>
          {report.content_markdown}
        </Typography>
      </Paper>

      <Snackbar
        open={copied}
        autoHideDuration={2500}
        onClose={() => setCopied(false)}
        message="Report copied to clipboard!"
      />
    </Box>
  );
}
