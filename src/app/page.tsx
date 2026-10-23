import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <AppShell>
      <DashboardView />
    </AppShell>
  );
}
