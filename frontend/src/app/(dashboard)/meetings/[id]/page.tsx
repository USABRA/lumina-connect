"use client";

import { useParams } from "next/navigation";

import MeetingHostPage from "@/components/meetings/MeetingHostPage";

export default function MeetingDetailPage() {
  const params = useParams();
  const meetingId = Number(params.id);
  if (!Number.isFinite(meetingId)) {
    return null;
  }
  return <MeetingHostPage meetingId={meetingId} />;
}
