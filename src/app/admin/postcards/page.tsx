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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { postcardEmailTemplate } from "@/lib/email-templates";

type RecipientFilter = "all" | "ageGroup" | "block";

export default function AdminPostcardsPage() {
  const [heading, setHeading] = useState("A Message from Rugby Buddies");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<RecipientFilter>("all");
  const [filterId, setFilterId] = useState("");
  const [ageGroups, setAgeGroups] = useState<{ id: string; name: string }[]>([]);
  const [blocks, setBlocks] = useState<{ id: string; title: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    try {
      const [aRes, bRes] = await Promise.all([
        fetch("/api/admin/age-groups"),
        fetch("/api/admin/blocks"),
      ]);
      const [aData, bData] = await Promise.all([aRes.json(), bRes.json()]);
      if (aRes.ok) setAgeGroups(aData);
      if (bRes.ok) setBlocks(bData.map((b: { id: string; title: string }) => ({ id: b.id, title: b.title })));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const previewHtml = postcardEmailTemplate("Alex Parent", message || "Your message will appear here.", heading);

  async function sendPostcard() {
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/postcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heading: heading.trim(),
          message: message.trim(),
          recipientFilter: filter,
          ...(filter !== "all" ? { filterId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setResult(`Sent: ${data.sent}, failed: ${data.failed}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-950">Digital postcards</h1>
        <p className="text-emerald-800/80">Rugby-themed email layout for a personal touch.</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      {result && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {result}
        </p>
      )}

      <Card className="border-emerald-900/10">
        <CardHeader>
          <CardTitle className="text-emerald-950">Compose postcard</CardTitle>
          <CardDescription>Heading and message are merged into the postcard template.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input value={heading} onChange={(e) => setHeading(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Recipients</Label>
            <Select value={filter} onValueChange={(v) => setFilter(v as RecipientFilter)}>
              <SelectTrigger className="max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All active users</SelectItem>
                <SelectItem value="ageGroup">By age group</SelectItem>
                <SelectItem value="block">By block</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filter === "ageGroup" && (
            <Select value={filterId} onValueChange={setFilterId}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Age group" />
              </SelectTrigger>
              <SelectContent>
                {ageGroups.map((ag) => (
                  <SelectItem key={ag.id} value={ag.id}>
                    {ag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filter === "block" && (
            <Select value={filterId} onValueChange={setFilterId}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Block" />
              </SelectTrigger>
              <SelectContent>
                {blocks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            className="bg-emerald-800 hover:bg-emerald-900"
            disabled={sending || !message.trim() || (filter !== "all" && !filterId)}
            onClick={sendPostcard}
          >
            {sending ? "Sending…" : "Send postcard"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-amber-600/30 bg-gradient-to-br from-amber-50/50 to-white">
        <CardHeader>
          <CardTitle className="text-emerald-950">Preview</CardTitle>
          <CardDescription>Sample name: “Alex Parent”</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="overflow-auto rounded-lg border border-amber-700/20 bg-white shadow-inner"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
