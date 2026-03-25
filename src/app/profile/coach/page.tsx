export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { UserRound } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Our Coach | Rugby Buddy",
  description: "Meet the Rugby Buddy coaching team.",
};

function parseJsonArray(raw: string | null | undefined): unknown[] {
  if (!raw?.trim()) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function parseStats(raw: string | null | undefined): { label: string; value: string }[] {
  if (!raw?.trim()) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (Array.isArray(v)) {
      return v.map((item, i) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const o = item as Record<string, unknown>;
          const label = String(o.label ?? o.name ?? o.title ?? `Stat ${i + 1}`);
          const value = String(o.value ?? o.count ?? o.total ?? "");
          return { label, value };
        }
        return { label: `Item ${i + 1}`, value: String(item) };
      });
    }
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.entries(v as Record<string, unknown>).map(([k, val]) => ({
        label: k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim(),
        value: String(val),
      }));
    }
  } catch {
    /* ignore */
  }
  return [];
}

export default async function CoachProfilePage() {
  const profile = await prisma.coachProfile.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!profile) {
    return (
      <div className="grass-pattern min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <Card className="border-green-200 bg-white/95 text-center shadow-lg">
            <CardContent className="py-16">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#2D5F2D]/10 text-[#2D5F2D]">
                <UserRound className="h-10 w-10" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-green-900 sm:text-3xl">Coming soon</h1>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Our coach profile is on the way. Check back shortly to meet the team behind Rugby Buddy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const highlights = parseJsonArray(profile.careerHighlights);
  const statEntries = parseStats(profile.stats);
  const achievements = parseJsonArray(profile.achievements);

  return (
    <div className="grass-pattern min-h-screen">
      <section className="relative overflow-hidden border-b border-green-900/20 bg-gradient-to-br from-[#2D5F2D] via-[#356f35] to-[#244a24] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(212,168,67,0.2),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start">
            <div className="shrink-0">
              {profile.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photoUrl}
                  alt={profile.name}
                  className="h-48 w-48 rounded-2xl border-4 border-[#D4A843] object-cover shadow-xl sm:h-56 sm:w-56"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-2xl border-4 border-[#D4A843] bg-black/20 sm:h-56 sm:w-56">
                  <UserRound className="h-24 w-24 text-[#D4A843]/80" aria-hidden />
                </div>
              )}
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">{profile.name}</h1>
              {profile.title && (
                <p className="mt-3 text-lg text-[#D4A843] sm:text-xl">{profile.title}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <h2 className="mb-4 font-heading text-2xl font-bold text-green-900">Biography</h2>
          <Card className="border-green-100 bg-white/90">
            <CardContent className="space-y-4 py-6 text-muted-foreground leading-relaxed">
              {profile.bio.split(/\n\n+/).map((para: string, i: number) => (
                <p key={i} className="whitespace-pre-wrap">
                  {para}
                </p>
              ))}
            </CardContent>
          </Card>
        </section>

        {highlights.length > 0 && (
          <section>
            <h2 className="mb-4 font-heading text-2xl font-bold text-green-900">Career highlights</h2>
            <Card className="border-green-100 bg-white/90">
              <CardContent className="py-6">
                <ul className="space-y-4">
                  {highlights.map((item, i) => {
                    if (typeof item === "string") {
                      return (
                        <li key={i} className="flex gap-3 border-l-4 border-[#D4A843] pl-4">
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      );
                    }
                    if (item && typeof item === "object" && "text" in item) {
                      const o = item as { year?: string; text?: string };
                      return (
                        <li key={i} className="flex gap-3 border-l-4 border-[#D4A843] pl-4">
                          {o.year && (
                            <span className="shrink-0 font-heading font-semibold text-[#2D5F2D]">{o.year}</span>
                          )}
                          <span className="text-muted-foreground">{String(o.text ?? "")}</span>
                        </li>
                      );
                    }
                    return (
                      <li key={i} className="border-l-4 border-[#D4A843] pl-4 text-muted-foreground">
                        {JSON.stringify(item)}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </section>
        )}

        {statEntries.length > 0 && (
          <section>
            <h2 className="mb-4 font-heading text-2xl font-bold text-green-900">Statistics</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {statEntries.map((s) => (
                <Card key={s.label} className="border-green-100 bg-gradient-to-br from-white to-green-50/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-heading text-2xl font-bold text-[#2D5F2D]">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {achievements.length > 0 && (
          <section>
            <h2 className="mb-4 font-heading text-2xl font-bold text-green-900">Achievements</h2>
            <Card className="border-green-100 bg-white/90">
              <CardContent className="flex flex-wrap gap-2 py-6">
                {achievements.map((a, i) => (
                  <Badge key={i} variant="secondary" className="text-sm">
                    {typeof a === "string" ? a : JSON.stringify(a)}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
