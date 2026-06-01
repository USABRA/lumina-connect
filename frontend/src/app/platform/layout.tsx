import AuthGuard from "@/components/AuthGuard";
import PlatformRouteGuard from "@/components/PlatformRouteGuard";
import PlatformShell from "@/components/platform/PlatformShell";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PlatformRouteGuard>
        <PlatformShell>{children}</PlatformShell>
      </PlatformRouteGuard>
    </AuthGuard>
  );
}
