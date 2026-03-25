export const dynamic = "force-dynamic";

import Link from "next/link";
import { CalendarDays, MapPin, Clock, Users, Tag, CheckCircle, AlertCircle, XCircle, Ticket } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPence, formatShortDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function termBadgeClass(type: string) {
  switch (type) {
    case "AUTUMN":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "WINTER":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "SUMMER":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "CONFIRMED":
      return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    case "PENDING":
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case "CANCELLED":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "success" as const;
    case "PENDING":
      return "warning" as const;
    case "CANCELLED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export default async function PublicBookingsPage() {
  const now = new Date();
  const session = await getServerSession(authOptions);

  const myBookings = session?.user?.id
    ? await prisma.booking.findMany({
        where: {
          userId: session.user.id,
          status: { not: "CANCELLED" },
        },
        include: {
          child: true,
          block: {
            include: {
              term: true,
              ageGroup: true,
              sessions: { orderBy: { date: "asc" } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const activeMyBookings = myBookings.filter((b) => {
    const lastSession = b.block.sessions[b.block.sessions.length - 1];
    return lastSession && new Date(lastSession.date) >= now;
  });

  const blocks = await prisma.block.findMany({
    where: { isActive: true },
    include: {
      term: true,
      ageGroup: true,
      sessions: { orderBy: { date: "asc" } },
      _count: {
        select: {
          bookings: { where: { status: "CONFIRMED" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const upcomingBlocks = blocks.filter((b) => {
    const lastSession = b.sessions[b.sessions.length - 1];
    return lastSession && new Date(lastSession.date) >= now;
  });

  return (
    <div className="grass-pattern min-h-screen">
      <section className="rugby-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Bookings
          </h1>
          <p className="mt-2 text-lg text-green-100">
            Browse our upcoming training blocks and book your child&apos;s place.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        {/* My Bookings section - only shown when logged in and has bookings */}
        {session && activeMyBookings.length > 0 && (
          <section>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-white">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-green-900 sm:text-2xl">
                  My Bookings
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your current training sessions
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeMyBookings.map((booking) => {
                const nextSession = booking.block.sessions.find(
                  (s) => new Date(s.date) >= now
                );
                const sessionsRemaining = booking.block.sessions.filter(
                  (s) => new Date(s.date) >= now
                ).length;

                return (
                  <Card
                    key={booking.id}
                    className="border-l-4 border-l-green-600 border-green-100 bg-white shadow-sm"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={statusBadgeVariant(booking.status)}>
                          {statusIcon(booking.status)}
                          <span className="ml-1">{booking.status}</span>
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {booking.paymentStatus}
                        </Badge>
                      </div>
                      <CardTitle className="font-heading text-base text-green-900 mt-2">
                        {booking.block.title}
                      </CardTitle>
                      <CardDescription>
                        {booking.child.firstName} {booking.child.lastName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={termBadgeClass(booking.block.term.type)}>
                          {booking.block.term.name}
                        </Badge>
                        <Badge variant="outline">{booking.block.ageGroup.name}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-green-600" />
                        <span>{booking.block.locationName}</span>
                      </div>
                      {nextSession && (
                        <div className="rounded-md bg-green-50 p-2.5">
                          <p className="text-xs font-medium text-green-800">Next session</p>
                          <p className="text-sm font-semibold text-green-900">
                            {formatShortDate(nextSession.date)} &middot; {nextSession.startTime} &ndash; {nextSession.endTime}
                          </p>
                          <p className="text-xs text-green-700 mt-0.5">
                            {sessionsRemaining} session{sessionsRemaining !== 1 ? "s" : ""} remaining
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-4">
              <Link
                href="/dashboard/bookings/my"
                className="text-sm font-medium text-green-700 underline-offset-4 hover:underline"
              >
                View all my bookings &rarr;
              </Link>
            </div>
          </section>
        )}

        {/* Logged in but no bookings */}
        {session && activeMyBookings.length === 0 && (
          <section>
            <Card className="border-green-100 bg-green-50/50">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <Ticket className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">You don&apos;t have any active bookings yet</p>
                  <p className="text-sm text-muted-foreground">
                    Browse the available blocks below and book your child&apos;s place.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Available Bookings */}
        <section>
          <h2 className="mb-2 font-heading text-xl font-bold text-green-900 sm:text-2xl">
            Available Blocks
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Choose a training block to book your child into.
          </p>

          {upcomingBlocks.length === 0 ? (
            <Card className="border-green-100 bg-white/90">
              <CardContent className="py-16 text-center">
                <CalendarDays className="mx-auto mb-4 h-12 w-12 text-green-300" />
                <p className="text-lg font-medium text-green-900">No bookings available right now</p>
                <p className="mt-1 text-muted-foreground">
                  Check back soon for new training blocks.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingBlocks.map((block) => {
                const slotsUsed = block._count.bookings;
                const slotsRemaining = block.maxSlots - slotsUsed;
                const isFull = slotsRemaining <= 0;
                const firstSession = block.sessions[0];
                const lastSession = block.sessions[block.sessions.length - 1];

                return (
                  <Card
                    key={block.id}
                    className="flex flex-col border-green-100 bg-white/90 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="pb-3">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge className={termBadgeClass(block.term.type)}>
                          {block.term.name}
                        </Badge>
                        <Badge variant="outline">{block.ageGroup.name}</Badge>
                      </div>
                      <CardTitle className="font-heading text-lg text-green-900">
                        {block.title}
                      </CardTitle>
                      {block.description && (
                        <CardDescription className="line-clamp-2">
                          {block.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="flex-1 space-y-3 text-sm">
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span>{block.locationName}</span>
                      </div>

                      <div className="flex items-start gap-2 text-muted-foreground">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span>
                          {block.sessions.length} session{block.sessions.length !== 1 ? "s" : ""}
                          {firstSession && lastSession && (
                            <>
                              {" "}
                              &middot; {formatShortDate(firstSession.date)} &ndash;{" "}
                              {formatShortDate(lastSession.date)}
                            </>
                          )}
                        </span>
                      </div>

                      {firstSession && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          <span>
                            {firstSession.startTime} &ndash; {firstSession.endTime}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start gap-2 text-muted-foreground">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span>
                          {isFull ? (
                            <span className="font-semibold text-red-600">Fully booked</span>
                          ) : (
                            <>
                              <span className="font-semibold text-green-700">
                                {slotsRemaining}
                              </span>{" "}
                              of {block.maxSlots} slots available
                            </>
                          )}
                        </span>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull
                              ? "bg-red-500"
                              : slotsRemaining <= 3
                              ? "bg-amber-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min((slotsUsed / block.maxSlots) * 100, 100)}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-amber-600" />
                        <span className="text-lg font-bold text-green-900">
                          {formatPence(block.priceInPence)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          for all {block.sessions.length} sessions
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button
                        asChild
                        className="w-full"
                        disabled={isFull}
                      >
                        <Link href={isFull ? "#" : "/dashboard/bookings"}>
                          {isFull ? "Fully Booked" : "Book Now"}
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
