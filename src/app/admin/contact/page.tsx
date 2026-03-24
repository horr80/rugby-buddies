"use client";

import { useCallback, useEffect, useState } from "react";
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

type ContactConfig = {
  id?: string;
  adminEmail: string;
  phone: string | null;
  address: string | null;
  mapEmbedUrl: string | null;
  additionalInfo: string | null;
};

export default function AdminContactPage() {
  const [form, setForm] = useState<ContactConfig>({
    adminEmail: "",
    phone: "",
    address: "",
    mapEmbedUrl: "",
    additionalInfo: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/contact");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      if (data && data.adminEmail != null) {
        setForm({
          id: data.id,
          adminEmail: data.adminEmail ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          mapEmbedUrl: data.mapEmbedUrl ?? "",
          additionalInfo: data.additionalInfo ?? "",
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
      const res = await fetch("/api/admin/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: form.adminEmail.trim(),
          phone: form.phone?.trim() || null,
          address: form.address?.trim() || null,
          mapEmbedUrl: form.mapEmbedUrl?.trim() || null,
          additionalInfo: form.additionalInfo?.trim() || null,
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
      <div>
        <h1 className="text-3xl font-bold text-emerald-950">Contact configuration</h1>
        <p className="text-emerald-800/80">Details shown on the contact page and for enquiries.</p>
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
          <CardTitle className="text-emerald-950">Public contact details</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : "Update and save to apply site-wide."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin email</Label>
            <Input
              id="adminEmail"
              type="email"
              value={form.adminEmail}
              onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              rows={3}
              value={form.address ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="map">Map embed URL</Label>
            <Input
              id="map"
              value={form.mapEmbedUrl ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, mapEmbedUrl: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="extra">Additional info</Label>
            <Textarea
              id="extra"
              rows={4}
              value={form.additionalInfo ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, additionalInfo: e.target.value }))}
            />
          </div>
          <Button
            className="bg-emerald-800 hover:bg-emerald-900"
            disabled={saving || !form.adminEmail.trim()}
            onClick={save}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
