import AdminRouteGuard from "@/components/AdminRouteGuard";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>
        <AdminRouteGuard>{children}</AdminRouteGuard>
      </AppShell>
    </AuthGuard>
  );
}
