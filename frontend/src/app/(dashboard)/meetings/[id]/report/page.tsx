"use client";

import { useParams } from "next/navigation";

import MeetingReportPage from "@/components/meetings/MeetingReportPage";

export default function MeetingReportRoute() {
  const params = useParams();
  const meetingId = Number(params.id);
  if (!Number.isFinite(meetingId)) {
    return null;
  }
  return <MeetingReportPage meetingId={meetingId} />;
}
