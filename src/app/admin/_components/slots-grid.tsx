"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SlotRow = {
  id: string;
  title: string;
  maxSlots: number;
  booked: number;
  available: number;
  ageGroup: { id: string; name: string; sortOrder: number };
  term: { id: string; name: string };
};

type Term = { id: string; name: string };

export function SlotsGrid() {
  const [rows, setRows] = useState<SlotRow[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("__all__");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (termId: string) => {
    setLoading(true);
    try {
      const qs = termId && termId !== "__all__" ? `?termId=${termId}` : "";
      const res = await fetch(`/api/admin/slots-summary${qs}`);
      if (res.ok) setRows(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/admin/terms")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTerms(data); })
      .catch(() => {});
    load("__all__");
  }, [load]);

  useEffect(() => {
    load(selectedTerm);
  }, [selectedTerm, load]);

  const grouped = rows.reduce<Record<string, { ageGroup: string; sortOrder: number; blocks: SlotRow[] }>>((acc, r) => {
    const key = r.ageGroup.id;
    if (!acc[key]) acc[key] = { ageGroup: r.ageGroup.name, sortOrder: r.ageGroup.sortOrder, blocks: [] };
    acc[key].blocks.push(r);
    return acc;
  }, {});

  const groups = Object.values(grouped).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Card className="border-emerald-900/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle className="text-emerald-950">Available Slots by Age Group</CardTitle>
          <CardDescription>Capacity overview for active blocks</CardDescription>
        </div>
        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filter by term" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All terms</SelectItem>
            {terms.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active blocks found.</p>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.ageGroup}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-800">
                  {g.ageGroup}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {g.blocks.map((b) => {
                    const pct = b.maxSlots > 0 ? Math.round((b.booked / b.maxSlots) * 100) : 0;
                    const full = b.available <= 0;
                    return (
                      <div key={b.id} className="rounded-lg border border-emerald-900/10 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-emerald-950 leading-tight">{b.title}</p>
                          <Badge variant={full ? "destructive" : "secondary"} className="shrink-0 text-xs">
                            {full ? "FULL" : `${b.available} left`}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{b.term.name}</p>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                          <div
                            className={`h-full rounded-full transition-all ${full ? "bg-red-500" : pct > 75 ? "bg-amber-500" : "bg-emerald-600"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {b.booked} / {b.maxSlots} booked ({pct}%)
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
