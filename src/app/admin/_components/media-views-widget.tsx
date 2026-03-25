"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewBreakdown = {
  mediaItemId: string;
  title: string;
  type: string;
  views: number;
};

type ViewData = {
  totalViews: number;
  breakdown: ViewBreakdown[];
  days: number;
};

const PERIOD_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
];

export function MediaViewsWidget() {
  const [data, setData] = useState<ViewData | null>(null);
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/media-views?days=${d}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  return (
    <Card className="border-emerald-900/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-emerald-950">
            <Eye className="h-5 w-5 text-amber-600" />
            Media Views
          </CardTitle>
          <CardDescription>How many times media links have been viewed</CardDescription>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data || data.totalViews === 0 ? (
          <p className="text-sm text-muted-foreground">No views recorded in this period.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-950">{data.totalViews}</span>
              <span className="text-sm text-muted-foreground">total views</span>
            </div>
            <ul className="divide-y divide-emerald-900/10">
              {data.breakdown.slice(0, 10).map((item) => (
                <li key={item.mediaItemId} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-emerald-950">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.type === "VIDEO" ? "Video" : "Photo"}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    {item.views} {item.views === 1 ? "view" : "views"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
