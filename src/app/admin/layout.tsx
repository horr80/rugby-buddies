import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "./_components/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if ((session.user as { role?: string }).role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminShell>{children}</AdminShell>;
}
