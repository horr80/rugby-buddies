"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Check,
  ExternalLink,
  Loader2,
  MapPin,
  AlertCircle,
  XCircle,
} from "lucide-react";
import type { BookingStatus, PaymentStatus } from "@prisma/client";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, cn } from "@/lib/utils";

type SessionRow = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
};

type BookingRow = {
  id: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  child: { id: string; firstName: string; lastName: string };
  block: {
    id: string;
    title: string;
    locationName: string;
    locationAddress: string | null;
    paymentLink: string | null;
    ageGroup: { name: string };
    term: { name: string; endDate: string };
    sessions: SessionRow[];
  };
};

function bookingStatusVariant(status: BookingStatus): "warning" | "success" | "destructive" {
  switch (status) {
    case "PENDING":
      return "warning";
    case "CONFIRMED":
      return "success";
    case "CANCELLED":
      return "destructive";
    default:
      return "warning";
  }
}

function paymentBadgeClass(p: PaymentStatus) {
  switch (p) {
    case "PAID":
      return "border-emerald-600/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100";
    case "PENDING":
      return "border-amber-500/50 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100";
    case "UNPAID":
      return "border-muted-foreground/30 bg-muted text-foreground";
    case "REFUNDED":
      return "border-blue-500/40 bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-100";
    default:
      return "";
  }
}

function sessionIsPast(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function MyBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [tab, setTab] = useState<"current" | "past">("current");
  const [showBookedBanner, setShowBookedBanner] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<BookingRow | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (searchParams.get("booked") === "1") {
      setShowBookedBanner(true);
      router.replace("/dashboard/bookings/my", { scroll: false });
    }
  }, [searchParams, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/my");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not load bookings");
        setBookings([]);
        return;
      }
      setBookings(json as BookingRow[]);
    } catch {
      setError("Something went wrong. Please try again.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const now = useMemo(() => new Date(), []);

  const { current, past } = useMemo(() => {
    const c: BookingRow[] = [];
    const p: BookingRow[] = [];
    for (const b of bookings) {
      const end = new Date(b.block.term.endDate);
      if (end >= now) c.push(b);
      else p.push(b);
    }
    return { current: c, past: p };
  }, [bookings, now]);

  const list = tab === "current" ? current : past;

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${cancelTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "Could not cancel");
        setCancelling(false);
        return;
      }
      setCancelTarget(null);
      await load();
    } catch {
      setError("Could not cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-[#2D5F2D]">
        <Loader2 className="h-10 w-10 animate-spin text-[#D4A843]" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading your bookings…</p>
      </div>
    );
  }

  if (error && !bookings.length) {
    return (
      <div className="space-y-4">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Couldn’t load bookings</CardTitle>
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
      {showBookedBanner ? (
        <div
          className="flex items-center justify-between gap-3 rounded-lg border border-[#2D5F2D]/30 bg-[#2D5F2D]/10 px-4 py-3 text-sm text-[#2D5F2D]"
          role="status"
        >
          <span className="font-medium">Booking created successfully.</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-[#2D5F2D]"
            onClick={() => setShowBookedBanner(false)}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D5F2D]">My bookings</h1>
          <p className="mt-1 text-muted-foreground">
            Current and past blocks for your children, payment status, and session dates.
          </p>
        </div>
        <Button
          asChild
          className="shrink-0 bg-[#D4A843] text-[#1a1a1a] hover:bg-[#c49a3c]"
        >
          <Link href="/dashboard/bookings">Book another session</Link>
        </Button>
      </div>

      <div
        className="inline-flex rounded-lg border border-[#2D5F2D]/20 bg-background p-1 shadow-sm"
        role="tablist"
        aria-label="Booking period"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "current"}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
            tab === "current"
              ? "bg-[#2D5F2D] text-white shadow"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setTab("current")}
        >
          Current ({current.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "past"}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
            tab === "past"
              ? "bg-[#2D5F2D] text-white shadow"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setTab("past")}
        >
          Past ({past.length})
        </button>
      </div>

      {list.length === 0 ? (
        <Card className="border-dashed border-[#2D5F2D]/25">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="mb-3 h-12 w-12 text-[#D4A843]/80" />
            <p className="font-medium text-[#2D5F2D]">
              {tab === "current" ? "No current bookings" : "No past bookings"}
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {tab === "current"
                ? "When you book a block, it will appear here."
                : "Finished terms will show in this tab."}
            </p>
            {tab === "current" ? (
              <Button asChild className="mt-6 bg-[#2D5F2D] hover:bg-[#244a24]">
                <Link href="/dashboard/bookings">Browse sessions</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {list.map((booking) => {
            const canCancel =
              booking.status !== "CANCELLED" && tab === "current";
            const showPay =
              booking.status === "PENDING" &&
              !!booking.block.paymentLink;

            return (
              <Card
                key={booking.id}
                className="overflow-hidden border-[#2D5F2D]/20 shadow-md"
              >
                <CardHeader className="border-b border-[#D4A843]/25 bg-gradient-to-r from-[#2D5F2D]/8 to-transparent">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-xl text-[#2D5F2D]">
                        {booking.block.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {booking.child.firstName} {booking.child.lastName}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={bookingStatusVariant(booking.status)}>
                        {booking.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={paymentBadgeClass(booking.paymentStatus)}
                      >
                        Payment: {booking.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {booking.block.term.name} · {booking.block.ageGroup.name}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="inline-flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A843]" />
                    <span>
                      {booking.block.locationName}
                      {booking.block.locationAddress
                        ? ` — ${booking.block.locationAddress}`
                        : ""}
                    </span>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-[#2D5F2D]">Sessions</p>
                    <ul className="space-y-2">
                      {booking.block.sessions.map((s) => {
                        const past = sessionIsPast(s.date);
                        return (
                          <li
                            key={s.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#2D5F2D]/10 bg-muted/20 px-3 py-2 text-sm"
                          >
                            <span className="inline-flex items-center gap-2">
                              {past ? (
                                <Check
                                  className="h-4 w-4 text-[#2D5F2D]"
                                  aria-label="Past session"
                                />
                              ) : (
                                <Calendar className="h-4 w-4 text-[#D4A843]" aria-hidden />
                              )}
                              <span className="font-medium">{formatDate(s.date)}</span>
                            </span>
                            <span className="text-muted-foreground">
                              {s.startTime} – {s.endTime}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t bg-[#2D5F2D]/5 sm:flex-row sm:flex-wrap sm:justify-end">
                  {showPay ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full border border-[#D4A843]/50 bg-[#D4A843]/20 text-[#1a1a1a] hover:bg-[#D4A843]/35 sm:w-auto"
                      onClick={() =>
                        window.open(booking.block.paymentLink!, "_blank", "noopener,noreferrer")
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Pay now
                    </Button>
                  ) : null}
                  {canCancel ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 sm:w-auto"
                      onClick={() => {
                        setError(null);
                        setCancelTarget(booking);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel booking
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#2D5F2D]">Cancel this booking?</DialogTitle>
            <DialogDescription>
              {cancelTarget ? (
                <>
                  This will mark <strong>{cancelTarget.block.title}</strong> for{" "}
                  <strong>
                    {cancelTarget.child.firstName} {cancelTarget.child.lastName}
                  </strong>{" "}
                  as cancelled. This cannot be undone from your account.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelTarget(null)}
              disabled={cancelling}
            >
              Keep booking
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelling}
              onClick={confirmCancel}
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Yes, cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#D4A843]" />
        </div>
      }
    >
      <MyBookingsContent />
    </Suspense>
  );
}
