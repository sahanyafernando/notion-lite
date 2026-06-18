import { DashboardClient } from "@/components/dashboard/workspace-grid";
import { getUserWorkspaces } from "@/server/actions/workspaces";

export default async function DashboardPage() {
  const workspaces = await getUserWorkspaces();

  return <DashboardClient workspaces={workspaces} />;
}
