"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const KEYS = [
  { key: "payment_provider", label: "Payment provider" },
  { key: "payment_link_template", label: "Payment link template" },
  { key: "smtp_host", label: "SMTP host" },
  { key: "smtp_port", label: "SMTP port" },
  { key: "smtp_user", label: "SMTP user" },
  { key: "smtp_from", label: "SMTP from" },
  { key: "site_name", label: "Site name" },
  { key: "site_tagline", label: "Site tagline" },
] as const;

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setValues(data as Record<string, string>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveKey(key: string) {
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: values[key] ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveAll() {
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      for (const { key } of KEYS) {
        const res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value: values[key] ?? "" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed on ${key}`);
      }
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-950">Site settings</h1>
        <p className="text-emerald-800/80">Key–value configuration stored in the database.</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      {ok && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Saved.
        </p>
      )}

      <Card className="border-emerald-900/10">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-emerald-950">Configuration</CardTitle>
            <CardDescription>
              {loading ? "Loading…" : "Save individual fields or all at once."}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-800/30"
            disabled={saving || loading}
            onClick={saveAll}
          >
            Save all
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {KEYS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={values[key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 bg-amber-100 text-amber-950 hover:bg-amber-200"
                disabled={saving || loading}
                onClick={() => saveKey(key)}
              >
                Save
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
