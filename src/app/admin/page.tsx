import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatPence } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  ClipboardList,
  Package,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { SlotsGrid } from "./_components/slots-grid";
import { MediaViewsWidget } from "./_components/media-views-widget";

type RecentBooking = {
  id: string;
  createdAt: Date;
  user: { firstName: string; lastName: string; email: string };
  child: { firstName: string; lastName: string };
  block: { title: string; priceInPence: number };
};

export default async function AdminDashboardPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalUsers, totalBookings, activeBlocks, upcomingSessions] = await Promise.all([
    prisma.user.count(),
    prisma.booking.count(),
    prisma.block.count({ where: { isActive: true } }),
    prisma.session.count({
      where: { date: { gte: startOfToday } },
    }),
  ]);

  const recentBookings = (await prisma.booking.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      child: { select: { firstName: true, lastName: true } },
      block: { select: { title: true, priceInPence: true } },
    },
  })) as RecentBooking[];

  const statCards = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      bar: "bg-gradient-to-r from-emerald-700 to-emerald-900",
    },
    {
      label: "Total Bookings",
      value: totalBookings,
      icon: ClipboardList,
      bar: "bg-gradient-to-r from-amber-600 to-amber-800",
    },
    {
      label: "Active Blocks",
      value: activeBlocks,
      icon: Package,
      bar: "bg-gradient-to-r from-emerald-800 to-emerald-950",
    },
    {
      label: "Upcoming Sessions",
      value: upcomingSessions,
      icon: CalendarClock,
      bar: "bg-gradient-to-r from-amber-500 to-amber-700",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">Dashboard</h1>
        <p className="mt-1 text-emerald-800/80">Overview of Rugby Buddy operations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, bar }) => (
          <Card
            key={label}
            className="overflow-hidden border-emerald-900/10 shadow-md"
          >
            <div className={`${bar} px-4 pb-4 pt-4 text-white`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white/90">{label}</p>
                <Icon className="h-5 w-5 text-amber-300" />
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-emerald-900/10 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-emerald-950">Recent bookings</CardTitle>
              <CardDescription>Latest five registrations</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="border-emerald-800/30">
              <Link href="/admin/bookings">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-emerald-900/10">
                {recentBookings.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <div>
                      <p className="font-medium text-emerald-950">
                        {b.child.firstName} {b.child.lastName}
                      </p>
                      <p className="text-muted-foreground">
                        Parent: {b.user.firstName} {b.user.lastName} · {b.block.title}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{formatDate(b.createdAt)}</p>
                      <p>{formatPence(b.block.priceInPence)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-600/20 bg-gradient-to-b from-amber-50/80 to-white">
          <CardHeader>
            <CardTitle className="text-emerald-950">Quick actions</CardTitle>
            <CardDescription>Jump to common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild className="justify-between bg-emerald-800 hover:bg-emerald-900">
              <Link href="/admin/blocks">
                Create block
                <Package className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between border-emerald-800/30">
              <Link href="/admin/announcements">
                New announcement
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between border-emerald-800/30">
              <Link href="/admin/messages">
                Send message
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between border-emerald-800/30">
              <Link href="/admin/email">
                Email blast
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <SlotsGrid />

      <MediaViewsWidget />
    </div>
  );
}
