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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { blastEmailTemplate } from "@/lib/email-templates";

type RecipientFilter = "all" | "ageGroup" | "block";

export default function AdminEmailPage() {
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [filter, setFilter] = useState<RecipientFilter>("all");
  const [filterId, setFilterId] = useState("");
  const [ageGroups, setAgeGroups] = useState<{ id: string; name: string }[]>([]);
  const [blocks, setBlocks] = useState<{ id: string; title: string }[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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

  const previewHtml = blastEmailTemplate(subject || "Subject", htmlBody || "<p>…</p>");

  async function sendEmail() {
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          body: htmlBody,
          recipientFilter: filter,
          ...(filter !== "all" ? { filterId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setResult(`Sent: ${data.sent}, failed: ${data.failed}`);
      setConfirmOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-950">Email blasts</h1>
        <p className="text-emerald-800/80">HTML-friendly emails via your configured SMTP.</p>
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
          <CardTitle className="text-emerald-950">Compose</CardTitle>
          <CardDescription>Body supports simple HTML (e.g. &lt;p&gt;, &lt;strong&gt;, &lt;a&gt;).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Body (HTML)</Label>
            <Textarea rows={10} value={htmlBody} onChange={(e) => setHtmlBody(e.target.value)} />
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

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
              Preview
            </Button>
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!subject.trim() || !htmlBody.trim() || (filter !== "all" && !filterId)}
              onClick={() => setConfirmOpen(true)}
            >
              Send email
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-emerald-950">HTML preview</DialogTitle>
          </DialogHeader>
          <div
            className="max-h-[60vh] overflow-auto rounded-md border border-emerald-900/10 bg-white p-2"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-emerald-950">Send this email?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will email all recipients matching your filter using the live SMTP configuration.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              disabled={sending}
              onClick={sendEmail}
            >
              {sending ? "Sending…" : "Confirm send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
