export const dynamic = "force-dynamic";

import Link from "next/link";
import { Play, Sparkles, Users, Trophy } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate, formatShortDate, getYouTubeThumbnail } from "@/lib/utils";
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

function excerptFromContent(content: string, max = 140) {
  const plain = content.replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).trim()}…`;
}

type HomeAnnouncement = {
  id: string;
  title: string;
  content: string;
  publishDate: Date;
};

type HomeMedia = {
  id: string;
  title: string;
  type: "VIDEO" | "PHOTO";
  url: string;
  thumbnailUrl: string | null;
};

type HomeSession = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  block: { title: string; locationName: string };
};

export default async function HomePage() {
  const now = new Date();

  const [announcements, mediaItems, upcomingSessions] = (await Promise.all([
    prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { publishDate: "desc" },
      take: 3,
    }),
    prisma.mediaItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
    prisma.session.findMany({
      where: {
        date: { gte: now },
        block: { isActive: true },
      },
      orderBy: { date: "asc" },
      take: 3,
      include: { block: true },
    }),
  ])) as [HomeAnnouncement[], HomeMedia[], HomeSession[]];

  return (
    <div className="grass-pattern min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden rugby-gradient text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,168,67,0.25),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex items-center gap-6">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
              Rugby Buddy
            </h1>
            <span className="hidden text-sm text-green-200 sm:inline">Where Young Champions Are Made</span>
            <div className="ml-auto flex items-center gap-3">
              <Button
                asChild
                size="sm"
                className="bg-[#D4A843] text-[#2D5F2D] hover:bg-[#c49838]"
              >
                <Link href="/dashboard/bookings">Book a Session</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link href="/profile/coach">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-14 sm:px-6 lg:px-8">
        {/* Announcements */}
        <section>
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold text-green-900 sm:text-3xl">Latest announcements</h2>
              <p className="mt-1 text-muted-foreground">News and updates from Rugby Buddy.</p>
            </div>
            <Link
              href="/announcements"
              className="text-sm font-medium text-[#2D5F2D] underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>
          {announcements.length === 0 ? (
            <p className="rounded-xl border border-dashed border-green-200 bg-white/80 px-6 py-10 text-center text-muted-foreground">
              No announcements yet. Check back soon.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {announcements.map((a: HomeAnnouncement) => (
                <Card key={a.id} className="border-green-100 bg-white/90 shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg text-green-900 line-clamp-2">{a.title}</CardTitle>
                    <CardDescription>{formatDate(a.publishDate)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-4">{excerptFromContent(a.content)}</p>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href="/announcements"
                      className="text-sm font-medium text-[#D4A843] hover:text-amber-700"
                    >
                      Read more
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Featured media */}
        <section>
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold text-green-900 sm:text-3xl">Featured media</h2>
              <p className="mt-1 text-muted-foreground">Highlights from training and match days.</p>
            </div>
            <Link
              href="/media"
              className="text-sm font-medium text-[#2D5F2D] underline-offset-4 hover:underline"
            >
              Full gallery
            </Link>
          </div>
          {mediaItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-green-200 bg-white/80 px-6 py-10 text-center text-muted-foreground">
              Media coming soon.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {mediaItems.map((m: HomeMedia) => {
                const thumb =
                  m.thumbnailUrl ??
                  (m.type === "VIDEO" ? getYouTubeThumbnail(m.url) : null);
                return (
                  <Link
                    key={m.id}
                    href="/media"
                    className="group relative block overflow-hidden rounded-xl border border-green-100 bg-zinc-900 shadow-sm ring-offset-background transition hover:ring-2 hover:ring-[#D4A843]"
                  >
                    <div className="aspect-video w-full">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2D5F2D] to-zinc-800 text-xs text-white/70">
                          {m.title}
                        </div>
                      )}
                    </div>
                    {m.type === "VIDEO" && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4A843] text-[#2D5F2D] shadow-lg">
                          <Play className="h-6 w-6 fill-current" />
                        </span>
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                      <p className="truncate text-xs font-medium text-white sm:text-sm">{m.title}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming sessions */}
        <section>
          <h2 className="mb-2 font-heading text-2xl font-bold text-green-900 sm:text-3xl">Upcoming sessions</h2>
          <p className="mb-8 text-muted-foreground">Next dates on the calendar.</p>
          {upcomingSessions.length === 0 ? (
            <Card className="border-green-100 bg-white/90">
              <CardContent className="py-10 text-center text-muted-foreground">
                No upcoming sessions scheduled.{" "}
                <Link href="/dashboard/bookings" className="font-medium text-[#2D5F2D] underline-offset-2 hover:underline">
                  Book when available
                </Link>
                .
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {upcomingSessions.map((s: HomeSession) => (
                <Card key={s.id} className="border-green-100 bg-white/90 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-heading text-base text-green-900">{s.block.title}</CardTitle>
                    <CardDescription>
                      {formatShortDate(s.date)} · {s.startTime}
                      {s.endTime ? ` – ${s.endTime}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{s.block.locationName}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Why Rugby Buddy */}
        <section className="rounded-2xl border border-green-100 bg-white/90 p-8 shadow-sm sm:p-10">
          <h2 className="mb-8 text-center font-heading text-2xl font-bold text-green-900 sm:text-3xl">
            Why Rugby Buddy?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-green-100 bg-green-50/50">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#2D5F2D] text-[#D4A843]">
                  <Trophy className="h-6 w-6" />
                </div>
                <CardTitle className="font-heading text-green-900">Professional coaching</CardTitle>
                <CardDescription>
                  Structured sessions led by experienced coaches who focus on skills, safety, and confidence.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-green-100 bg-green-50/50">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#2D5F2D] text-[#D4A843]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <CardTitle className="font-heading text-green-900">Fun environment</CardTitle>
                <CardDescription>
                  Games-based learning so every child enjoys the pitch and builds friendships for life.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-green-100 bg-green-50/50">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#2D5F2D] text-[#D4A843]">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="font-heading text-green-900">All ages welcome</CardTitle>
                <CardDescription>
                  Age-appropriate groups so beginners and improvers all have a place to thrive.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
