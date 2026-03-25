"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  UsersRound,
  CalendarDays,
  Package,
  ClipboardList,
  Users,
  Megaphone,
  MessagesSquare,
  Send,
  Images,
  BellRing,
  Phone,
  Trophy,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string; icon: LucideIcon; end?: boolean };

const nav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { href: "/admin/age-groups", label: "Age Groups", icon: UsersRound },
  { href: "/admin/terms", label: "Terms", icon: CalendarDays },
  { href: "/admin/blocks", label: "Blocks & Sessions", icon: Package },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/messages", label: "Messages", icon: MessagesSquare },
  { href: "/admin/email", label: "Email Blasts", icon: Send },
  { href: "/admin/media", label: "Media", icon: Images },
  { href: "/admin/reminders", label: "Reminders", icon: BellRing },
  { href: "/admin/contact", label: "Contact Us", icon: Phone },
  { href: "/admin/coach", label: "My Life", icon: Trophy },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string, end?: boolean) => {
    const active = end ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
    return cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      active
        ? "bg-amber-400/20 text-amber-300"
        : "text-emerald-100/90 hover:bg-white/10 hover:text-white"
    );
  };

  const Sidebar = (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-emerald-950/50 bg-[#0f2918] shadow-xl transition-transform lg:static lg:translate-x-0",
        open ? "flex translate-x-0" : "hidden -translate-x-full lg:flex"
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-emerald-900/60 px-4">
        <span className="text-xl font-bold tracking-tight text-amber-400">🏉</span>
        <div>
          <p className="text-sm font-semibold text-white">Rugby Buddy</p>
          <p className="text-xs text-emerald-200/70">Admin</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto text-white hover:bg-white/10 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {nav.map(({ href, label, icon: Icon, end }) => (
          <Link
            key={href}
            href={href}
            className={linkClass(href, end)}
            onClick={() => setOpen(false)}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-90" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-emerald-900/60 p-3 text-xs text-emerald-300/60">
        Green & gold club console
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[#f4f7f4]">
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
      )}
      {Sidebar}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-emerald-900/10 bg-white/90 px-4 backdrop-blur lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-emerald-800/30"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-emerald-950">Admin</span>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
