import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Calendar, MessageSquare, ClipboardList, ArrowRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [upcomingSessionsCount, unreadMessagesCount, activeBookingsCount] = await Promise.all([
    prisma.session.count({
      where: {
        date: { gte: startOfToday },
        block: {
          bookings: {
            some: { userId },
          },
        },
      },
    }),
    prisma.message.count({
      where: { recipientId: userId, isRead: false },
    }),
    prisma.booking.count({
      where: {
        userId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
  ]);

  const firstName = user?.firstName ?? "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-[#2D5F2D]">
          Welcome back, {firstName}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here’s a snapshot of your Rugby Buddy activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-[#2D5F2D]/15 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming sessions</CardTitle>
            <Calendar className="h-4 w-4 text-[#D4A843]" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#2D5F2D]">{upcomingSessionsCount}</p>
            <p className="text-xs text-muted-foreground mt-1">From your booked blocks</p>
          </CardContent>
        </Card>
        <Card className="border-[#2D5F2D]/15 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unread messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-[#D4A843]" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#2D5F2D]">{unreadMessagesCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Waiting in your inbox</p>
          </CardContent>
        </Card>
        <Card className="border-[#2D5F2D]/15 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active bookings</CardTitle>
            <ClipboardList className="h-4 w-4 text-[#D4A843]" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#2D5F2D]">{activeBookingsCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending or confirmed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#2D5F2D]/20 bg-[#2D5F2D]/5">
        <CardHeader>
          <CardTitle className="text-lg text-[#2D5F2D]">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="default" asChild>
            <Link href="/dashboard/bookings" className="inline-flex items-center gap-2">
              Book a Session
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" className="border-[#2D5F2D]/40 text-[#2D5F2D] hover:bg-[#2D5F2D]/10" asChild>
            <Link href="/dashboard/messages" className="inline-flex items-center gap-2">
              View Messages
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
