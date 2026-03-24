import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  MessageSquare,
  User,
  Shield,
  ChevronDown,
} from "lucide-react";
import { authOptions } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Dashboard Home", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Book sessions", icon: Calendar },
  { href: "/dashboard/bookings/my", label: "My bookings", icon: CalendarDays },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
] as const;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-muted/40">
      <details className="md:hidden group border-b border-[#244a24] bg-[#2D5F2D] text-white shadow-md">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-[#D4A843]" />
            Dashboard menu
          </span>
          <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180 text-[#D4A843]" />
        </summary>
        <nav className="flex flex-col gap-1 border-t border-white/10 px-2 pb-3 pt-1" aria-label="Dashboard">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-white/10"
            >
              <Icon className="h-4 w-4 text-[#D4A843]" />
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium bg-[#D4A843]/20 text-[#D4A843] hover:bg-[#D4A843]/30"
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          )}
        </nav>
      </details>

      <aside
        className="hidden md:flex w-60 shrink-0 flex-col border-r border-[#244a24] bg-[#2D5F2D] text-white shadow-inner"
        aria-label="Dashboard sidebar"
      >
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white border border-white/20"
              style={{ backgroundColor: "#D4A843" }}
            >
              RB
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Member area</p>
              <p className="text-sm font-semibold leading-tight">Rugby Buddies</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-white/95 hover:bg-white/10 hover:text-white"
            >
              <Icon className="h-4 w-4 text-[#D4A843]" />
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="mt-2 flex items-center gap-2 rounded-md border border-[#D4A843]/40 bg-[#D4A843]/15 px-3 py-2.5 text-sm font-semibold text-[#D4A843] hover:bg-[#D4A843]/25"
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          )}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
