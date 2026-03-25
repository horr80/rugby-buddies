import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Announcements | Rugby Buddy",
  description: "News and updates from Rugby Buddy.",
};

const PAGE_SIZE = 10;

type Props = {
  searchParams: { page?: string };
};

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  publishDate: Date;
  createdBy: { firstName: string; lastName: string };
};

export default async function AnnouncementsPage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { publishDate: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.announcement.count({ where: { isActive: true } }),
  ]);

  const rows = announcements as AnnouncementRow[];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const postedBy = (a: AnnouncementRow) => `${a.createdBy.firstName} ${a.createdBy.lastName}`.trim();

  return (
    <div className="grass-pattern min-h-screen">
      <div className="border-b border-green-100 bg-gradient-to-r from-[#2D5F2D] to-[#3d7a3d] text-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Announcements</h1>
          <p className="mt-2 text-green-100">Stay up to date with Rugby Buddy news.</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-green-200 bg-white/90 px-6 py-16 text-center text-muted-foreground">
            No announcements to show.
          </p>
        ) : (
          rows.map((a: AnnouncementRow) => (
            <Card key={a.id} className="border-green-100 bg-white/90 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <CardTitle className="font-heading text-xl text-green-900 sm:text-2xl">{a.title}</CardTitle>
                  <CardDescription className="shrink-0 sm:text-right">
                    {formatDate(a.publishDate)}
                  </CardDescription>
                </div>
                <p className="text-sm text-muted-foreground">Posted by {postedBy(a)}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-foreground leading-relaxed">
                  {a.content.split(/\n\n+/).map((para: string, i: number) => (
                    <p key={i} className="whitespace-pre-wrap leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-green-100 pt-8 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <Button variant="outline" asChild>
                  <Link href={`/announcements?page=${page - 1}`}>Previous</Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Previous
                </Button>
              )}
              {page < totalPages ? (
                <Button variant="outline" asChild>
                  <Link href={`/announcements?page=${page + 1}`}>Next</Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Next
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
