export type AppRole = "admin" | "company_user";

export function isAdmin(role: AppRole | string | undefined): boolean {
  return role === "admin";
}

export const ADMIN_ONLY_PATHS = ["/team", "/settings", "/enterprise"] as const;

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
