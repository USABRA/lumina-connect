const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
  } | null;
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
};

export type DashboardStats = {
  active_campaigns: number;
  products_tracked: number;
  total_interactions: number;
  leads_captured: number;
};

export type AnalyticsOverview = {
  total_scans: number;
  scans_today: number;
  unique_products_scanned: number;
  total_leads: number;
  conversion_rate: number;
  top_products: { unique_code: string; product_type: string; scan_count: number }[];
  top_campaigns: {
    campaign_name: string;
    scan_count: number;
    lead_count: number;
    conversion_rate: number;
  }[];
  leads_by_campaign: { campaign_name: string; lead_count: number }[];
  by_country: { country: string; scan_count: number }[];
  by_device: { device_type: string; scan_count: number }[];
  geo_points: { city: string | null; country: string; scan_count: number }[];
  daily_scans: { date: string; scan_count: number }[];
};

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
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
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

export async function syncUser(
  token: string,
  data: { name: string; company_name?: string }
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

export async function updateProfile(
  data: { name?: string; avatar_url?: string | null },
  token?: string
): Promise<UserProfile> {
  return apiFetch<UserProfile>("/auth/me", {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

export async function getAuthStatus(): Promise<{
  firebase_configured: boolean;
  message: string;
}> {
  return apiFetch("/auth/status");
}

export class ProductUnavailableError extends Error {
  constructor() {
    super("Product is not available");
    this.name = "ProductUnavailableError";
  }
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
  email: string;
  phone?: string;
  company?: string;
}): Promise<void> {
  await apiFetch("/leads", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
