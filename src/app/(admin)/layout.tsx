import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/shell/admin-header";
import { BottomNav } from "@/components/shell/bottom-nav";
import { SidebarDesktop } from "@/components/shell/sidebar-desktop";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <AdminHeader />
      <div className="flex flex-1">
        <SidebarDesktop />
        <main className="flex-1 pb-20 md:pb-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
