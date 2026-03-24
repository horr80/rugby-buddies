"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  AlertCircle,
} from "lucide-react";
import type { TermType } from "@prisma/client";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatPence, formatShortDate, cn } from "@/lib/utils";

type SessionRow = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
};

type BlockRow = {
  id: string;
  title: string;
  description: string | null;
  locationName: string;
  locationAddress: string | null;
  maxSlots: number;
  priceInPence: number;
  paymentLink: string | null;
  term: { id: string; name: string; type: TermType; endDate: string; startDate: string };
  ageGroup: { id: string; name: string };
  sessions: SessionRow[];
  _count: { confirmedBookings: number };
};

type ChildRow = { id: string; firstName: string; lastName: string; ageGroupId: string | null };

type ApiPayload = {
  blocks: BlockRow[];
  children: ChildRow[];
  existingBookings: { blockId: string; childId: string }[];
};

function termBadgeClass(type: TermType) {
  switch (type) {
    case "AUTUMN":
      return "border-orange-400/60 bg-orange-500/15 text-orange-900 dark:text-orange-100";
    case "WINTER":
      return "border-blue-400/60 bg-blue-500/15 text-blue-900 dark:text-blue-100";
    case "SUMMER":
      return "border-yellow-500/60 bg-yellow-400/20 text-yellow-900 dark:text-yellow-950";
    default:
      return "";
  }
}

export default function BookSessionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiPayload | null>(null);
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [termFilter, setTermFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookTarget, setBookTarget] = useState<BlockRow | null>(null);
  const [childId, setChildId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/blocks/available");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not load sessions");
        setData(null);
        return;
      }
      setData(json as ApiPayload);
    } catch {
      setError("Something went wrong. Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const terms = useMemo(() => {
    if (!data?.blocks.length) return [];
    const map = new Map<string, string>();
    for (const b of data.blocks) {
      map.set(b.term.id, b.term.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data?.blocks]);

  const ageGroups = useMemo(() => {
    if (!data?.blocks.length) return [];
    const map = new Map<string, string>();
    for (const b of data.blocks) {
      map.set(b.ageGroup.id, b.ageGroup.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data?.blocks]);

  const filteredBlocks = useMemo(() => {
    if (!data) return [];
    return data.blocks.filter((b) => {
      if (ageFilter !== "all" && b.ageGroup.id !== ageFilter) return false;
      if (termFilter !== "all" && b.term.id !== termFilter) return false;
      return true;
    });
  }, [data, ageFilter, termFilter]);

  const childrenForBlock = (block: BlockRow) => {
    if (!data) return [];
    const taken = new Set(
      data.existingBookings.filter((e) => e.blockId === block.id).map((e) => e.childId)
    );
    return data.children.filter((c) => !taken.has(c.id));
  };

  const openBookDialog = (block: BlockRow) => {
    setBookTarget(block);
    setSubmitError(null);
    const available = childrenForBlock(block);
    setChildId(available[0]?.id ?? "");
  };

  const closeBookDialog = () => {
    setBookTarget(null);
    setSubmitError(null);
    setSubmitting(false);
  };

  const confirmBook = async () => {
    if (!bookTarget || !childId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId: bookTarget.id, childId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? "Booking failed");
        setSubmitting(false);
        return;
      }
      if (bookTarget.paymentLink) {
        window.open(bookTarget.paymentLink, "_blank", "noopener,noreferrer");
      }
      closeBookDialog();
      router.push("/dashboard/bookings/my?booked=1");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-[#2D5F2D]">
        <Loader2 className="h-10 w-10 animate-spin text-[#D4A843]" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading available sessions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Couldn’t load sessions</CardTitle>
              <CardDescription>{error}</CardDescription>
            </div>
          </CardHeader>
          <CardFooter>
            <Button type="button" onClick={() => load()} variant="outline">
              Try again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D5F2D]">Browse & book</h1>
          <p className="mt-1 text-muted-foreground">
            Choose a block for your child and complete payment online where a link is provided.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="shrink-0 border-[#2D5F2D]/40 text-[#2D5F2D] hover:bg-[#2D5F2D]/10"
        >
          <Link href="/dashboard/bookings/my">View my bookings</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-2 sm:w-56">
          <Label htmlFor="age-filter">Age group</Label>
          <Select value={ageFilter} onValueChange={setAgeFilter}>
            <SelectTrigger id="age-filter" className="bg-background">
              <SelectValue placeholder="All age groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All age groups</SelectItem>
              {ageGroups.map((ag) => (
                <SelectItem key={ag.id} value={ag.id}>
                  {ag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:w-56">
          <Label htmlFor="term-filter">Term</Label>
          <Select value={termFilter} onValueChange={setTermFilter}>
            <SelectTrigger id="term-filter" className="bg-background">
              <SelectValue placeholder="All terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All terms</SelectItem>
              {terms.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!data?.children.length ? (
        <Card className="border-[#D4A843]/40 bg-[#2D5F2D]/5">
          <CardHeader>
            <CardTitle className="text-[#2D5F2D]">Add a child first</CardTitle>
            <CardDescription>
              You need at least one child on your profile before you can book a block.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="bg-[#2D5F2D] hover:bg-[#244a24]">
              <Link href="/dashboard/profile">Go to profile</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {filteredBlocks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="mb-3 h-12 w-12 text-[#D4A843]/80" />
            <p className="font-medium text-[#2D5F2D]">No blocks match your filters</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Try clearing filters or check back later for new terms.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {filteredBlocks.map((block) => {
            const confirmed = block._count.confirmedBookings;
            const remaining = Math.max(0, block.maxSlots - confirmed);
            const full = remaining <= 0;
            const availableChildren = childrenForBlock(block);
            const canBook = !full && availableChildren.length > 0;
            const allChildrenBooked =
              (data?.children.length ?? 0) > 0 && availableChildren.length === 0 && !full;
            const firstSession = block.sessions[0];
            const lastSession = block.sessions[block.sessions.length - 1];
            const fillPct = block.maxSlots > 0 ? (remaining / block.maxSlots) * 100 : 0;

            return (
              <Card
                key={block.id}
                className={cn(
                  "overflow-hidden border-[#2D5F2D]/15 shadow-md transition-shadow hover:shadow-lg",
                  expandedId === block.id && "ring-2 ring-[#D4A843]/50"
                )}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setExpandedId((id) => (id === block.id ? null : block.id))}
                  aria-expanded={expandedId === block.id}
                >
                  <CardHeader className="space-y-3 pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="pr-8 text-xl text-[#2D5F2D]">{block.title}</CardTitle>
                      {expandedId === block.id ? (
                        <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    {block.description ? (
                      <CardDescription className="line-clamp-2">{block.description}</CardDescription>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={termBadgeClass(block.term.type)}>
                        {block.term.name} · {block.term.type}
                      </Badge>
                      <Badge variant="secondary" className="bg-[#2D5F2D]/10 text-[#2D5F2D]">
                        {block.ageGroup.name}
                      </Badge>
                    </div>
                  </CardHeader>
                </button>
                <CardContent className="space-y-4 pb-4">
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#D4A843]" aria-hidden />
                      <span>
                        {block.locationName}
                        {block.locationAddress ? (
                          <span className="text-muted-foreground/80"> — {block.locationAddress}</span>
                        ) : null}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#2D5F2D]">
                      <Calendar className="h-4 w-4 text-[#D4A843]" aria-hidden />
                      {block.sessions.length} session{block.sessions.length === 1 ? "" : "s"}
                    </span>
                    {firstSession && lastSession ? (
                      <span className="text-muted-foreground">
                        {formatShortDate(firstSession.date)} – {formatShortDate(lastSession.date)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Dates TBC</span>
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#2D5F2D]">
                      {formatPence(block.priceInPence)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground">Slots remaining</span>
                      <span className={full ? "text-destructive" : "text-[#2D5F2D]"}>
                        {remaining} of {block.maxSlots} available
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          full ? "bg-destructive/70" : "bg-[#2D5F2D]"
                        )}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                  {expandedId === block.id && block.sessions.length > 0 ? (
                    <ul className="space-y-1.5 rounded-lg border border-[#2D5F2D]/10 bg-muted/30 p-3 text-sm">
                      {block.sessions.map((s) => (
                        <li key={s.id} className="flex flex-wrap justify-between gap-2">
                          <span className="font-medium text-foreground">{formatDate(s.date)}</span>
                          <span className="text-muted-foreground">
                            {s.startTime} – {s.endTime}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-2 border-t bg-[#2D5F2D]/5 pt-4">
                  {allChildrenBooked ? (
                    <p className="text-center text-xs text-muted-foreground">
                      All of your children are already booked on this block.
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    className="w-full bg-[#D4A843] text-[#1a1a1a] hover:bg-[#c49a3c]"
                    disabled={!canBook}
                    onClick={(e) => {
                      e.stopPropagation();
                      openBookDialog(block);
                    }}
                  >
                    {full ? "Fully booked" : !availableChildren.length ? "Already booked" : "Book now"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!bookTarget} onOpenChange={(open) => !open && closeBookDialog()}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
          {bookTarget ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#2D5F2D]">Confirm booking</DialogTitle>
                <DialogDescription>
                  Review the block and choose which child you are booking for.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-lg border border-[#2D5F2D]/15 bg-[#2D5F2D]/5 p-4">
                  <p className="font-semibold text-[#2D5F2D]">{bookTarget.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {bookTarget.term.name} · {bookTarget.ageGroup.name}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm">
                    <MapPin className="h-4 w-4 text-[#D4A843]" />
                    {bookTarget.locationName}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="book-child">Child</Label>
                  <Select value={childId} onValueChange={setChildId}>
                    <SelectTrigger id="book-child" className="bg-background">
                      <SelectValue placeholder="Select a child" />
                    </SelectTrigger>
                    <SelectContent>
                      {childrenForBlock(bookTarget).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Session dates</p>
                  <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-3 text-sm">
                    {bookTarget.sessions.map((s) => (
                      <li key={s.id} className="flex justify-between gap-2">
                        <span>{formatDate(s.date)}</span>
                        <span className="text-muted-foreground">
                          {s.startTime} – {s.endTime}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#D4A843]/40 bg-[#D4A843]/10 px-4 py-3">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-bold text-[#2D5F2D]">
                    {formatPence(bookTarget.priceInPence)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You will be redirected to complete payment
                  {bookTarget.paymentLink ? " (payment page opens in a new tab after you confirm)" : ""}.
                </p>
                {submitError ? (
                  <p className="text-sm font-medium text-destructive" role="alert">
                    {submitError}
                  </p>
                ) : null}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={closeBookDialog} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-[#2D5F2D] hover:bg-[#244a24]"
                  disabled={submitting || !childId}
                  onClick={confirmBook}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking…
                    </>
                  ) : (
                    "Confirm & book"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
