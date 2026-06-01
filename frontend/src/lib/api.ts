const DEFAULT_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://lumina-api-g99a.onrender.com"
    : "http://localhost:8000";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;

const API_FETCH_TIMEOUT_MS = 45_000;

export type UserProfile = {
  user: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    company_id: number | null;
    role: "admin" | "company_user";
  };
  company: {
    id: number;
    company_name: string;
    subscription_plan: string;
    brand_logo_url?: string | null;
    brand_color?: string | null;
    brand_tagline?: string | null;
    brand_website?: string | null;
    brand_phone?: string | null;
    default_meeting_url?: string | null;
    default_pdf_url?: string | null;
    white_label_enabled?: boolean;
    hide_platform_branding?: boolean;
    brand_display_name?: string | null;
    brand_favicon_url?: string | null;
    brand_secondary_color?: string | null;
    team_structure?: TeamStructure | null;
  } | null;
  is_platform_admin?: boolean;
};

type TeamGroup = {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  color?: string;
};

type TeamRole = {
  id: string;
  name: string;
  group_id?: string | null;
  description?: string;
  sort_order: number;
  color?: string;
};

export type TeamStructure = {
  groups: TeamGroup[];
  roles: TeamRole[];
};

export type CompanyBrand = NonNullable<UserProfile["company"]>;

export type CompanyBrandUpdate = {
  company_name?: string;
  brand_logo_url?: string | null;
  brand_color?: string | null;
  brand_tagline?: string | null;
  brand_website?: string | null;
  brand_phone?: string | null;
  default_meeting_url?: string | null;
  default_pdf_url?: string | null;
  white_label_enabled?: boolean;
  hide_platform_branding?: boolean;
  brand_display_name?: string | null;
  brand_favicon_url?: string | null;
  brand_secondary_color?: string | null;
};

export type PlatformCompanySummary = {
  id: number;
  company_name: string;
  brand_display_name: string | null;
  brand_logo_url: string | null;
  brand_color: string | null;
  brand_tagline: string | null;
  white_label_enabled: boolean;
  hide_platform_branding: boolean;
  product_count: number;
  sample_card_codes: string[];
  landing_base_url: string;
};

export type Campaign = {
  id: number;
  company_id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  product_count: number;
};

export type Product = {
  id: number;
  campaign_id: number;
  unique_code: string;
  product_type: string;
  qr_url: string | null;
  status: "active" | "inactive" | "archived";
  landing_headline: string | null;
  landing_description: string | null;
  logo_url: string | null;
  video_url: string | null;
  pdf_url: string | null;
  meeting_url: string | null;
  contact_form_enabled: boolean;
  landing_template: string;
  primary_color: string | null;
  hero_image_url: string | null;
  highlight_1: string | null;
  highlight_2: string | null;
  highlight_3: string | null;
  landing_blocks?: unknown;
  linkedin_url: string | null;
  whatsapp: string | null;
  team_role_id: string | null;
  assigned_user_id: number | null;
  event_tag: string | null;
};

export type CompanyMember = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "company_user";
  avatar_url?: string | null;
};

export type CompanyMemberCreateResponse = CompanyMember & {
  temporary_password?: string | null;
  login_hint?: string | null;
};

export type ProductPublic = {
  unique_code: string;
  product_type: string;
  qr_url: string | null;
  campaign_name: string;
  company_name: string;
  landing_headline: string | null;
  landing_description: string | null;
  logo_url: string | null;
  video_url: string | null;
  pdf_url: string | null;
  meeting_url: string | null;
  contact_form_enabled: boolean;
  landing_template: string;
  primary_color: string | null;
  hero_image_url: string | null;
  highlight_1: string | null;
  highlight_2: string | null;
  highlight_3: string | null;
  landing_blocks?: unknown;
  brand_website?: string | null;
  brand_tagline?: string | null;
  brand_display_name?: string | null;
  brand_favicon_url?: string | null;
  brand_secondary_color?: string | null;
  white_label_enabled?: boolean;
  hide_platform_branding?: boolean;
  linkedin_url?: string | null;
  whatsapp?: string | null;
  event_tag?: string | null;
};

export type LandingPageUpdate = {
  landing_headline?: string | null;
  landing_description?: string | null;
  logo_url?: string | null;
  video_url?: string | null;
  pdf_url?: string | null;
  meeting_url?: string | null;
  contact_form_enabled?: boolean;
  landing_template?: string | null;
  primary_color?: string | null;
  hero_image_url?: string | null;
  highlight_1?: string | null;
  highlight_2?: string | null;
  highlight_3?: string | null;
  landing_blocks?: unknown[] | null;
  linkedin_url?: string | null;
  whatsapp?: string | null;
  event_tag?: string | null;
};

export type LeadEvent = {
  id: number;
  product_code: string;
  product_type: string;
  campaign_name: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  created_at?: string | null;
  team_role_id?: string | null;
  team_role_name?: string | null;
  team_group_id?: string | null;
  team_group_name?: string | null;
  event_tag?: string | null;
};

export type DashboardStats = {
  active_campaigns: number;
  products_tracked: number;
  total_interactions: number;
  leads_captured: number;
  unique_visitors: number;
  conversion_rate: number;
};

type GrowthMetric = {
  value: number;
  growth_pct: number;
  description: string;
};

export type DashboardAnalytics = {
  total_taps: GrowthMetric;
  unique_visitors: GrowthMetric;
  leads_captured: GrowthMetric;
  meetings_scheduled: GrowthMetric;
  daily_scans: { date: string; scan_count: number }[];
  card_performance: {
    card_name: string;
    card_code: string;
    total_taps: number;
    leads: number;
    conversion_rate: number;
    team_role_id?: string | null;
    team_role_name?: string | null;
    team_group_name?: string | null;
  }[];
  recent_activity: {
    name: string;
    location: string;
    timestamp: string;
    action: string;
  }[];
  by_state: { state: string; scan_count: number }[];
  top_cities: { city: string; state: string | null; scan_count: number }[];
  lead_funnel: {
    card_taps: number;
    profile_views: number;
    contact_saved: number;
    lead_submitted: number;
    meeting_scheduled: number;
    tap_to_view_pct: number;
    view_to_contact_pct: number;
    contact_to_lead_pct: number;
    lead_to_meeting_pct: number;
  };
  networking_insights: {
    most_active_day: string;
    most_active_time: string;
    top_performing_card: string;
    average_conversion_rate: number;
    total_profile_views: number;
    average_session_duration: string;
  };
  team_leaderboard: {
    rank: number;
    name: string;
    card_code: string;
    card_taps: number;
    leads: number;
    meetings: number;
    conversion_rate: number;
    team_role_id?: string | null;
    team_role_name?: string | null;
    team_group_name?: string | null;
  }[];
  role_performance: {
    role_id: string | null;
    role_name: string;
    group_name: string | null;
    card_count: number;
    total_taps: number;
    leads: number;
    conversion_rate: number;
  }[];
  ai_insights: string[];
  lead_timelines: {
    lead_id: number;
    lead_name: string;
    events: { timestamp: string; action: string }[];
  }[];
};

export type AnalyticsOverview = {
  total_scans: number;
  scans_today: number;
  unique_products_scanned: number;
  total_leads: number;
  conversion_rate: number;
  top_products: {
    unique_code: string;
    product_type: string;
    scan_count: number;
    team_role_id?: string | null;
    team_role_name?: string | null;
    team_group_name?: string | null;
  }[];
  top_campaigns: {
    campaign_name: string;
    scan_count: number;
    lead_count: number;
    conversion_rate: number;
  }[];
  leads_by_campaign: { campaign_name: string; lead_count: number }[];
  top_roles: {
    role_id: string | null;
    role_name: string;
    group_name: string | null;
    scan_count: number;
    lead_count: number;
    conversion_rate: number;
  }[];
  leads_by_role: {
    role_id: string | null;
    role_name: string;
    group_name: string | null;
    lead_count: number;
  }[];
  by_country: { country: string; scan_count: number }[];
  by_device: { device_type: string; scan_count: number }[];
  geo_points: { city: string | null; country: string; scan_count: number }[];
  daily_scans: { date: string; scan_count: number }[];
  daily_leads: { date: string; lead_count: number }[];
  top_events?: { event_tag: string; scan_count: number; lead_count: number }[];
};

export type MeetingEvent = {
  id: number;
  timestamp: string;
  product_code: string;
  product_type: string;
  campaign_name: string;
  card_name: string;
  city: string | null;
  country: string | null;
  device_type: string | null;
  team_role_id?: string | null;
  team_role_name?: string | null;
  team_group_name?: string | null;
  event_tag?: string | null;
};

export type MeetingsListResponse = {
  summary: {
    total_clicks: number;
    unique_cards: number;
    cards_with_meeting_link: number;
  };
  events: MeetingEvent[];
};

export type MeetingSessionSummary = {
  id: number;
  title: string;
  scheduled_at: string | null;
  share_token: string;
  status: "draft" | "live" | "closed";
  event_tag: string | null;
  product_id: number | null;
  host_user_id: number;
  host_name: string;
  created_at: string;
  participant_count: number;
  has_report: boolean;
};

export type MeetingReportSummary = {
  id: number;
  meeting_id: number;
  meeting_title: string;
  generated_at: string;
};

export type MeetingSessionsListResponse = {
  sessions: MeetingSessionSummary[];
  reports: MeetingReportSummary[];
};

export type MeetingSessionDetail = MeetingSessionSummary & {
  join_url_path: string;
  notes: MeetingNotesContent;
  notes_updated_at: string | null;
};

export type MeetingNotesContent = {
  discussed: string;
  decisions: string;
  action_items: string;
  next_steps: string;
};

export type MeetingParticipantInfo = {
  id: number;
  name: string;
  email: string | null;
  company: string | null;
  is_active: boolean;
};

export type MeetingRoomState = {
  meeting_id: number;
  title: string;
  status: "draft" | "live" | "closed";
  scheduled_at: string | null;
  event_tag: string | null;
  notes: MeetingNotesContent;
  notes_updated_at: string | null;
  participants: MeetingParticipantInfo[];
};

export type MeetingJoinResponse = {
  session_id: string;
  participant_id: number;
  meeting_title: string;
  meeting_status: string;
  scheduled_at: string | null;
};

export type MeetingReportDetail = {
  id: number;
  meeting_id: number;
  generated_at: string;
  content_markdown: string;
  content_json: Record<string, unknown>;
};

export const MEETING_NOTE_SECTIONS: { key: keyof MeetingNotesContent; label: string }[] = [
  { key: "discussed", label: "What we discussed" },
  { key: "decisions", label: "Decisions made" },
  { key: "action_items", label: "Action items (who / what / when)" },
  { key: "next_steps", label: "Next steps" },
];

export function meetingJoinUrl(shareToken: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/meetings/join/${shareToken}`;
  }
  return `/meetings/join/${shareToken}`;
}

export async function getMeetingRoom(token: string): Promise<MeetingRoomState> {
  return apiFetch<MeetingRoomState>(`/meetings/join/${encodeURIComponent(token)}`);
}

export async function joinMeetingRoom(
  token: string,
  data: { name: string; email?: string; company?: string }
): Promise<MeetingJoinResponse> {
  return apiFetch<MeetingJoinResponse>(`/meetings/join/${encodeURIComponent(token)}/join`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMeetingNotes(
  token: string,
  participantSession: string,
  section: keyof MeetingNotesContent,
  content: string
): Promise<{ notes: MeetingNotesContent; notes_updated_at: string }> {
  return apiFetch(`/meetings/join/${encodeURIComponent(token)}/notes`, {
    method: "PATCH",
    headers: { "X-Participant-Session": participantSession },
    body: JSON.stringify({ section, content }),
  });
}

export async function meetingHeartbeat(
  token: string,
  participantSession: string
): Promise<void> {
  await apiFetch(`/meetings/join/${encodeURIComponent(token)}/heartbeat`, {
    method: "POST",
    headers: { "X-Participant-Session": participantSession },
  });
}

export type InteractionEvent = {
  id: number;
  timestamp: string;
  product_code: string;
  product_type: string;
  campaign_name: string;
  city: string | null;
  country: string | null;
  device_type: string | null;
  ip_address: string | null;
  team_role_id?: string | null;
  team_role_name?: string | null;
  team_group_name?: string | null;
  event_tag?: string | null;
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    signal: options.signal ?? AbortSignal.timeout(API_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const message =
      typeof detail.detail === "string"
        ? detail.detail
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function uploadImage(file: File, token?: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const result = await apiFetch<{ url: string }>("/uploads/image", {
    method: "POST",
    body: form,
    token,
  });
  return result.url;
}

export async function syncUser(
  token: string,
  data: {
    name: string;
    company_name?: string;
    brand_logo_url?: string | null;
    brand_color?: string | null;
  }
): Promise<UserProfile> {
  return apiFetch<UserProfile>("/auth/sync", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export async function getMe(token?: string): Promise<UserProfile> {
  return apiFetch<UserProfile>("/auth/me", { token });
}

export type AuthTokenResponse = UserProfile & {
  access_token: string;
  token_type: string;
};

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  company_name: string;
  brand_logo_url?: string | null;
  brand_color?: string | null;
}): Promise<AuthTokenResponse> {
  return apiFetch<AuthTokenResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCompanyBrand(
  token: string,
  data: Pick<CompanyBrandUpdate, "brand_logo_url" | "brand_color">
): Promise<CompanyBrand> {
  return apiFetch<CompanyBrand>("/companies/brand", {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthTokenResponse> {
  return apiFetch<AuthTokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export class ProductUnavailableError extends Error {
  constructor() {
    super("Product is not available");
    this.name = "ProductUnavailableError";
  }
}

export function getContactVcardUrl(code: string): string {
  return `${API_URL}/products/by-code/${encodeURIComponent(code)}/contact.vcf`;
}

export async function getProductPublic(code: string): Promise<ProductPublic> {
  const response = await fetch(`${API_URL}/products/by-code/${encodeURIComponent(code)}`, {
    cache: "no-store",
  });

  if (response.status === 410) {
    throw new ProductUnavailableError();
  }

  if (!response.ok) {
    throw new Error(`Product not found (${response.status})`);
  }

  return response.json() as Promise<ProductPublic>;
}

export async function downloadAnalyticsExport(token?: string): Promise<void> {
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/analytics/export`, { headers });
  if (!response.ok) {
    throw new Error("Export failed");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lumina-analytics.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export async function submitLead(data: {
  product_code: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  event_tag?: string;
}): Promise<void> {
  await apiFetch("/leads", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
