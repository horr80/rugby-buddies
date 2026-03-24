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
import { formatDate } from "@/lib/utils";

type SentBatch = { subject: string; body: string; sentAt: string; recipientCount: number };

type RecipientMode = "all" | "ageGroup" | "block";

export default function AdminMessagesPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<RecipientMode>("all");
  const [ageGroupId, setAgeGroupId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [ageGroups, setAgeGroups] = useState<{ id: string; name: string }[]>([]);
  const [blocks, setBlocks] = useState<{ id: string; title: string }[]>([]);
  const [sent, setSent] = useState<SentBatch[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingSent, setLoadingSent] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const [aRes, bRes] = await Promise.all([
        fetch("/api/admin/age-groups"),
        fetch("/api/admin/blocks"),
      ]);
      const [aData, bData] = await Promise.all([aRes.json(), bRes.json()]);
      if (aRes.ok) setAgeGroups(aData);
      if (bRes.ok) setBlocks(bData.map((b: { id: string; title: string }) => ({ id: b.id, title: b.title })));
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  const loadSent = useCallback(async () => {
    setLoadingSent(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/messages");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load sent");
      setSent(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoadingSent(false);
    }
  }, []);

  useEffect(() => {
    loadMeta();
    loadSent();
  }, [loadMeta, loadSent]);

  async function resolveRecipientIds(): Promise<string[]> {
    if (mode === "all") {
      const res = await fetch("/api/admin/users");
      const users = await res.json();
      if (!res.ok) throw new Error(users.error || "Failed users");
      return users.filter((u: { role: string }) => u.role === "PARENT").map((u: { id: string }) => u.id);
    }
    if (mode === "ageGroup") {
      if (!ageGroupId) throw new Error("Select an age group");
      const res = await fetch(`/api/admin/users?ageGroupId=${encodeURIComponent(ageGroupId)}`);
      const users = await res.json();
      if (!res.ok) throw new Error(users.error || "Failed users");
      return users.map((u: { id: string }) => u.id);
    }
    if (!blockId) throw new Error("Select a block");
    const res = await fetch("/api/bookings");
    const bookings = await res.json();
    if (!res.ok) throw new Error(bookings.error || "Failed bookings");
    const ids = new Set<string>();
    for (const b of bookings as { blockId: string; userId: string; status: string }[]) {
      if (b.blockId === blockId && b.status !== "CANCELLED") ids.add(b.userId);
    }
    return Array.from(ids);
  }

  async function sendMessage() {
    setSending(true);
    setError(null);
    try {
      const recipientIds = await resolveRecipientIds();
      if (recipientIds.length === 0) {
        throw new Error("No recipients match this selection");
      }
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          recipientIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setSubject("");
      setBody("");
      await loadSent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-950">Messages</h1>
        <p className="text-emerald-800/80">In-app messages to parents (delivered in their inbox).</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <Card className="border-emerald-900/10">
        <CardHeader>
          <CardTitle className="text-emerald-950">Compose</CardTitle>
          <CardDescription>Choose who receives a copy in their Rugby Buddies messages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-emerald-950">Recipients</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="recip"
                checked={mode === "all"}
                onChange={() => setMode("all")}
                className="h-4 w-4 border-emerald-800/40"
              />
              All users (parents)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="recip"
                checked={mode === "ageGroup"}
                onChange={() => setMode("ageGroup")}
                className="h-4 w-4 border-emerald-800/40"
              />
              By age group
            </label>
            {mode === "ageGroup" && (
              <Select value={ageGroupId} onValueChange={setAgeGroupId} disabled={loadingMeta}>
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
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="recip"
                checked={mode === "block"}
                onChange={() => setMode("block")}
                className="h-4 w-4 border-emerald-800/40"
              />
              By block
            </label>
            {mode === "block" && (
              <Select value={blockId} onValueChange={setBlockId} disabled={loadingMeta}>
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
          </fieldset>

          <Button
            className="bg-emerald-800 hover:bg-emerald-900"
            disabled={sending || !subject.trim() || !body.trim()}
            onClick={sendMessage}
          >
            {sending ? "Sending…" : "Send message"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-emerald-900/10">
        <CardHeader>
          <CardTitle className="text-emerald-950">Sent messages</CardTitle>
          <CardDescription>Grouped sends with recipient counts</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSent ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : sent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing sent yet.</p>
          ) : (
            <ul className="space-y-3">
              {sent.map((s, i) => (
                <li
                  key={`${s.sentAt}-${i}`}
                  className="rounded-lg border border-emerald-900/10 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-emerald-950">{s.subject}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(s.sentAt)} · {s.recipientCount} recipients
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
