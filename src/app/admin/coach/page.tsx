"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CoachProfile = {
  id?: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  careerHighlights: string;
  stats: string;
  achievements: string;
};

export default function AdminCoachPage() {
  const [form, setForm] = useState<CoachProfile>({
    name: "",
    title: "",
    bio: "",
    photoUrl: "",
    careerHighlights: "",
    stats: "",
    achievements: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/coach");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      if (data && data.name != null) {
        setForm({
          id: data.id,
          name: data.name ?? "",
          title: data.title ?? "",
          bio: data.bio ?? "",
          photoUrl: data.photoUrl ?? "",
          careerHighlights: data.careerHighlights ?? "",
          stats: data.stats ?? "",
          achievements: data.achievements ?? "",
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/admin/coach", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          title: form.title.trim() || null,
          bio: form.bio.trim(),
          photoUrl: form.photoUrl.trim() || null,
          careerHighlights: form.careerHighlights.trim() || null,
          stats: form.stats.trim() || null,
          achievements: form.achievements.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setForm((f) => ({ ...f, id: data.id }));
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">Coach profile</h1>
          <p className="text-emerald-800/80">Public coach page content.</p>
        </div>
        <Button asChild variant="outline" className="border-emerald-800/30">
          <Link href="/profile/coach" target="_blank" rel="noreferrer">
            Preview live page
          </Link>
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      {ok && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Saved successfully.
        </p>
      )}

      <Card className="border-emerald-900/10">
        <CardHeader>
          <CardTitle className="text-emerald-950">Profile fields</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : "JSON fields are stored as text; keep valid JSON if the site parses them."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea rows={5} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Photo URL</Label>
            <Input
              value={form.photoUrl}
              onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Career highlights (JSON)</Label>
            <p className="text-xs text-muted-foreground">
              JSON array of objects (e.g. year + text) if your public page expects structured data.
            </p>
            <Textarea
              rows={4}
              value={form.careerHighlights}
              onChange={(e) => setForm((f) => ({ ...f, careerHighlights: e.target.value }))}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Stats (JSON)</Label>
            <Textarea
              rows={3}
              value={form.stats}
              onChange={(e) => setForm((f) => ({ ...f, stats: e.target.value }))}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Achievements (JSON)</Label>
            <Textarea
              rows={3}
              value={form.achievements}
              onChange={(e) => setForm((f) => ({ ...f, achievements: e.target.value }))}
              className="font-mono text-sm"
            />
          </div>
          <Button
            className="bg-emerald-800 hover:bg-emerald-900"
            disabled={saving || !form.name.trim() || !form.bio.trim()}
            onClick={save}
          >
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
