"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "REFUNDED";

type Booking = {
  id: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  user: { firstName: string; lastName: string };
  child: { firstName: string; lastName: string };
  block: {
    id: string;
    title: string;
    ageGroup: { id: string; name: string };
  };
};

function bookingBadgeVariant(s: BookingStatus) {
  if (s === "CONFIRMED") return "success" as const;
  if (s === "CANCELLED") return "destructive" as const;
  return "warning" as const;
}

function paymentBadgeVariant(s: PaymentStatus) {
  if (s === "PAID") return "success" as const;
  if (s === "REFUNDED") return "secondary" as const;
  if (s === "PENDING") return "warning" as const;
  return "outline" as const;
}

export default function AdminBookingsPage() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ageGroupId, setAgeGroupId] = useState<string>("all");
  const [blockId, setBlockId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filterAgeGroups, setFilterAgeGroups] = useState<{ id: string; name: string }[]>([]);
  const [filterBlocks, setFilterBlocks] = useState<{ id: string; title: string }[]>([]);
  const [patchingId, setPatchingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookRes, agRes, blRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/admin/age-groups"),
        fetch("/api/admin/blocks"),
      ]);
      const [bookData, agData, blData] = await Promise.all([
        bookRes.json(),
        agRes.json(),
        blRes.json(),
      ]);
      if (!bookRes.ok) throw new Error(bookData.error || "Failed to load bookings");
      if (agRes.ok) setFilterAgeGroups(agData);
      if (blRes.ok)
        setFilterBlocks(
          blData.map((b: { id: string; title: string }) => ({ id: b.id, title: b.title }))
        );
      setRows(bookData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (ageGroupId !== "all" && r.block.ageGroup.id !== ageGroupId) return false;
      if (blockId !== "all" && r.block.id !== blockId) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, ageGroupId, blockId, statusFilter]);

  async function patchBooking(id: string, body: Record<string, unknown>) {
    setPatchingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setRows((prev) => prev.map((r) => (r.id === id ? (data as Booking) : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setPatchingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-950">Bookings</h1>
        <p className="text-emerald-800/80">Filter and update booking & payment status.</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <Card className="border-emerald-900/10">
        <CardHeader>
          <CardTitle className="text-emerald-950">Filters</CardTitle>
          <CardDescription>Narrow the list</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="min-w-[160px] flex-1 space-y-2">
            <p className="text-xs font-medium text-emerald-900/70">Age group</p>
            <Select value={ageGroupId} onValueChange={setAgeGroupId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filterAgeGroups.map((ag) => (
                  <SelectItem key={ag.id} value={ag.id}>
                    {ag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[160px] flex-1 space-y-2">
            <p className="text-xs font-medium text-emerald-900/70">Block</p>
            <Select value={blockId} onValueChange={setBlockId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filterBlocks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[160px] flex-1 space-y-2">
            <p className="text-xs font-medium text-emerald-900/70">Status</p>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-900/10">
        <CardHeader>
          <CardTitle className="text-emerald-950">All bookings</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${filtered.length} shown`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading bookings…
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings match.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-emerald-900/10 text-emerald-900/70">
                    <th className="pb-3 pr-3 font-semibold">Parent</th>
                    <th className="pb-3 pr-3 font-semibold">Child</th>
                    <th className="pb-3 pr-3 font-semibold">Block</th>
                    <th className="pb-3 pr-3 font-semibold">Age group</th>
                    <th className="pb-3 pr-3 font-semibold">Status</th>
                    <th className="pb-3 pr-3 font-semibold">Payment</th>
                    <th className="pb-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-emerald-900/5 align-top">
                      <td className="py-3 pr-3">
                        {r.user.firstName} {r.user.lastName}
                      </td>
                      <td className="py-3 pr-3">
                        {r.child.firstName} {r.child.lastName}
                      </td>
                      <td className="py-3 pr-3 font-medium text-emerald-950">{r.block.title}</td>
                      <td className="py-3 pr-3">{r.block.ageGroup.name}</td>
                      <td className="py-3 pr-3">
                        <Badge variant={bookingBadgeVariant(r.status)} className="mb-1">
                          {r.status}
                        </Badge>
                        <Select
                          value={r.status}
                          disabled={patchingId === r.id}
                          onValueChange={(v) => patchBooking(r.id, { status: v })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant={paymentBadgeVariant(r.paymentStatus)} className="mb-1">
                          {r.paymentStatus}
                        </Badge>
                        <Select
                          value={r.paymentStatus}
                          disabled={patchingId === r.id}
                          onValueChange={(v) => patchBooking(r.id, { paymentStatus: v })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UNPAID">Unpaid</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                            <SelectItem value="REFUNDED">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 text-muted-foreground">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
