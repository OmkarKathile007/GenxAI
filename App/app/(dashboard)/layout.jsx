import { ProtectedRoute } from '@/components/features/auth';
import WorkspaceShell from '@/components/features/workspace/WorkspaceShell';

export default function DashboardLayout({
  children,
}) {
  return (
    <ProtectedRoute>
      <WorkspaceShell>
        {children}
      </WorkspaceShell>
    </ProtectedRoute>
  );
}
