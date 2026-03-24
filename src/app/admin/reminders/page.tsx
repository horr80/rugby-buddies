"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

type Reminder = {
  id: string;
  sendBeforeDays: number;
  message: string;
  isActive: boolean;
  block: { id: string; title: string };
  sentReminders: { sentAt: string }[];
};

type BlockOpt = { id: string; title: string };

export default function AdminRemindersPage() {
  const [rows, setRows] = useState<Reminder[]>([]);
  const [blocks, setBlocks] = useState<BlockOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    blockId: "",
    sendBeforeDays: "2",
    message: "",
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rRes, bRes] = await Promise.all([
        fetch("/api/admin/reminders"),
        fetch("/api/admin/blocks"),
      ]);
      const [rData, bData] = await Promise.all([rRes.json(), bRes.json()]);
      if (!rRes.ok) throw new Error(rData.error || "Failed reminders");
      if (!bRes.ok) throw new Error(bData.error || "Failed blocks");
      setRows(rData);
      setBlocks(bData.map((b: { id: string; title: string }) => ({ id: b.id, title: b.title })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({
      blockId: blocks[0]?.id ?? "",
      sendBeforeDays: "2",
      message: "",
      isActive: true,
    });
    setDialogOpen(true);
  }

  function openEdit(r: Reminder) {
    setEditing(r);
    setForm({
      blockId: r.block.id,
      sendBeforeDays: String(r.sendBeforeDays),
      message: r.message,
      isActive: r.isActive,
    });
    setDialogOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        blockId: form.blockId,
        sendBeforeDays: Number(form.sendBeforeDays),
        message: form.message.trim(),
        isActive: form.isActive,
      };
      const url = editing ? `/api/admin/reminders/${editing.id}` : "/api/admin/reminders";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setDialogOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(id: string) {
    if (!confirm("Delete this reminder?")) return;
    try {
      const res = await fetch(`/api/admin/reminders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">Reminders</h1>
          <p className="text-emerald-800/80">Automated nudges before sessions (cron).</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-emerald-800 hover:bg-emerald-900"
          disabled={!blocks.length}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create reminder
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <Card className="border-emerald-900/10">
        <CardHeader>
          <CardTitle className="text-emerald-950">All reminders</CardTitle>
          <CardDescription>Per-block schedule and last send</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reminders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-emerald-900/10 text-emerald-900/70">
                    <th className="pb-3 pr-4 font-semibold">Block</th>
                    <th className="pb-3 pr-4 font-semibold">Days before</th>
                    <th className="pb-3 pr-4 font-semibold">Message</th>
                    <th className="pb-3 pr-4 font-semibold">Active</th>
                    <th className="pb-3 pr-4 font-semibold">Last sent</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const last = r.sentReminders[0]?.sentAt;
                    return (
                      <tr key={r.id} className="border-b border-emerald-900/5">
                        <td className="py-3 pr-4 font-medium text-emerald-950">{r.block.title}</td>
                        <td className="py-3 pr-4">{r.sendBeforeDays}</td>
                        <td className="max-w-xs truncate py-3 pr-4 text-muted-foreground">{r.message}</td>
                        <td className="py-3 pr-4">
                          {r.isActive ? (
                            <Badge variant="success">On</Badge>
                          ) : (
                            <Badge variant="outline">Off</Badge>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {last ? formatDate(last) : "—"}
                        </td>
                        <td className="py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeRow(r.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-emerald-950">
              {editing ? "Edit reminder" : "New reminder"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Block</Label>
              <Select value={form.blockId} onValueChange={(v) => setForm((f) => ({ ...f, blockId: v }))}>
                <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label>Send before (days)</Label>
              <Input
                type="number"
                value={form.sendBeforeDays}
                onChange={(e) => setForm((f) => ({ ...f, sendBeforeDays: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-emerald-800/40"
              />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-emerald-800 hover:bg-emerald-900" disabled={saving} onClick={save}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
