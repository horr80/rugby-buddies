"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { formatPence } from "@/lib/utils";
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

type SessionRow = { date: string; startTime: string; endTime: string };

type Block = {
  id: string;
  title: string;
  description: string | null;
  termId: string;
  ageGroupId: string;
  locationName: string;
  locationAddress: string | null;
  maxSlots: number;
  priceInPence: number;
  paymentLink: string | null;
  paymentProvider: string | null;
  isActive: boolean;
  sessions: { id: string; date: string; startTime: string; endTime: string }[];
  ageGroup: { name: string };
  term: { name: string };
  _count: { bookings: number };
};

type TermOpt = { id: string; name: string };
type AgeOpt = { id: string; name: string };

function toInputDate(d: string | Date) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const emptySession = (): SessionRow => ({ date: "", startTime: "", endTime: "" });

export default function AdminBlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [terms, setTerms] = useState<TermOpt[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeOpt[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Block | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    termId: "",
    ageGroupId: "",
    locationName: "",
    locationAddress: "",
    maxSlots: "12",
    pricePounds: "",
    paymentLink: "",
    paymentProvider: "",
    isActive: true,
    sessions: [emptySession()] as SessionRow[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, tRes, aRes] = await Promise.all([
        fetch("/api/admin/blocks"),
        fetch("/api/admin/terms"),
        fetch("/api/admin/age-groups"),
      ]);
      const [bData, tData, aData] = await Promise.all([bRes.json(), tRes.json(), aRes.json()]);
      if (!bRes.ok) throw new Error(bData.error || "Failed blocks");
      if (!tRes.ok) throw new Error(tData.error || "Failed terms");
      if (!aRes.ok) throw new Error(aData.error || "Failed age groups");
      setBlocks(bData);
      setTerms(tData);
      setAgeGroups(aData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleExpand(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  function openCreate() {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      termId: terms[0]?.id ?? "",
      ageGroupId: ageGroups[0]?.id ?? "",
      locationName: "",
      locationAddress: "",
      maxSlots: "12",
      pricePounds: "",
      paymentLink: "",
      paymentProvider: "",
      isActive: true,
      sessions: [emptySession()],
    });
    setDialogOpen(true);
  }

  function openEdit(block: Block) {
    setEditing(block);
    setForm({
      title: block.title,
      description: block.description ?? "",
      termId: block.termId,
      ageGroupId: block.ageGroupId,
      locationName: block.locationName,
      locationAddress: block.locationAddress ?? "",
      maxSlots: String(block.maxSlots),
      pricePounds: (block.priceInPence / 100).toFixed(2),
      paymentLink: block.paymentLink ?? "",
      paymentProvider: block.paymentProvider ?? "",
      isActive: block.isActive,
      sessions:
        block.sessions.length > 0
          ? block.sessions.map((s) => ({
              date: toInputDate(s.date),
              startTime: s.startTime,
              endTime: s.endTime,
            }))
          : [emptySession()],
    });
    setDialogOpen(true);
  }

  function updateSession(i: number, patch: Partial<SessionRow>) {
    setForm((f) => {
      const next = [...f.sessions];
      next[i] = { ...next[i], ...patch };
      return { ...f, sessions: next };
    });
  }

  function addSessionRow() {
    setForm((f) => ({ ...f, sessions: [...f.sessions, emptySession()] }));
  }

  function removeSessionRow(i: number) {
    setForm((f) => ({
      ...f,
      sessions: f.sessions.length > 1 ? f.sessions.filter((_, j) => j !== i) : f.sessions,
    }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const priceInPence = Math.round(parseFloat(form.pricePounds || "0") * 100);
      if (!form.title.trim() || !form.termId || !form.ageGroupId || !form.locationName.trim()) {
        throw new Error("Title, term, age group, and location are required");
      }
      const sessions = form.sessions.filter((s) => s.date && s.startTime && s.endTime);
      if (sessions.length === 0) throw new Error("Add at least one complete session");

      if (editing) {
        const res = await fetch(`/api/admin/blocks/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || null,
            termId: form.termId,
            ageGroupId: form.ageGroupId,
            locationName: form.locationName.trim(),
            locationAddress: form.locationAddress.trim() || null,
            maxSlots: Number(form.maxSlots),
            priceInPence,
            paymentLink: form.paymentLink.trim() || null,
            paymentProvider: form.paymentProvider.trim() || null,
            isActive: form.isActive,
            sessions: sessions.map((s) => ({
              date: s.date,
              startTime: s.startTime,
              endTime: s.endTime,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
      } else {
        const res = await fetch("/api/admin/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || null,
            termId: form.termId,
            ageGroupId: form.ageGroupId,
            locationName: form.locationName.trim(),
            locationAddress: form.locationAddress.trim() || null,
            maxSlots: Number(form.maxSlots),
            priceInPence,
            paymentLink: form.paymentLink.trim() || null,
            paymentProvider: form.paymentProvider.trim() || null,
            sessions: sessions.map((s) => ({
              date: s.date,
              startTime: s.startTime,
              endTime: s.endTime,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeBlock(id: string) {
    if (!confirm("Delete this block and its sessions?")) return;
    try {
      const res = await fetch(`/api/admin/blocks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">Blocks & sessions</h1>
          <p className="text-emerald-800/80">Training blocks and dated sessions.</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-emerald-800 hover:bg-emerald-900"
          disabled={!terms.length || !ageGroups.length}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create block
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <Card className="border-emerald-900/10">
        <CardHeader>
          <CardTitle className="text-emerald-950">All blocks</CardTitle>
          <CardDescription>Click a row to expand sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blocks yet.</p>
          ) : (
            <div className="space-y-2">
              {blocks.map((b) => {
                const open = expanded[b.id];
                const booked = b._count.bookings;
                return (
                  <div
                    key={b.id}
                    className="rounded-lg border border-emerald-900/10 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm"
                      onClick={() => toggleExpand(b.id)}
                    >
                      {open ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-emerald-950">{b.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.term.name} · {b.ageGroup.name} · {b.locationName}
                        </p>
                      </div>
                      <Badge variant="secondary">{formatPence(b.priceInPence)}</Badge>
                      <Badge variant="outline">
                        {booked}/{b.maxSlots} booked
                      </Badge>
                      {b.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="warning">Inactive</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(b);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBlock(b.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </button>
                    {open && (
                      <div className="border-t border-emerald-900/10 bg-emerald-50/40 px-4 py-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-900/60">
                          Sessions
                        </p>
                        {b.sessions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No sessions.</p>
                        ) : (
                          <ul className="space-y-1 text-sm">
                            {b.sessions.map((s) => (
                              <li key={s.id}>
                                {toInputDate(s.date)} · {s.startTime}–{s.endTime}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-emerald-950">
              {editing ? "Edit block" : "New block"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Term</Label>
                <Select value={form.termId} onValueChange={(v) => setForm((f) => ({ ...f, termId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Age group</Label>
                <Select
                  value={form.ageGroupId}
                  onValueChange={(v) => setForm((f) => ({ ...f, ageGroupId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Age group" />
                  </SelectTrigger>
                  <SelectContent>
                    {ageGroups.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location name</Label>
              <Input
                value={form.locationName}
                onChange={(e) => setForm((f) => ({ ...f, locationName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Location address</Label>
              <Input
                value={form.locationAddress}
                onChange={(e) => setForm((f) => ({ ...f, locationAddress: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max slots</Label>
                <Input
                  type="number"
                  value={form.maxSlots}
                  onChange={(e) => setForm((f) => ({ ...f, maxSlots: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Price (£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.pricePounds}
                  onChange={(e) => setForm((f) => ({ ...f, pricePounds: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment link</Label>
              <Input
                value={form.paymentLink}
                onChange={(e) => setForm((f) => ({ ...f, paymentLink: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment provider</Label>
              <Input
                value={form.paymentProvider}
                onChange={(e) => setForm((f) => ({ ...f, paymentProvider: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-emerald-800/40"
              />
              Block active
            </label>

            <div className="space-y-2 border-t border-emerald-900/10 pt-4">
              <div className="flex items-center justify-between">
                <Label>Sessions</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSessionRow}>
                  Add session
                </Button>
              </div>
              {form.sessions.map((s, i) => (
                <div key={i} className="grid gap-2 rounded-md border border-emerald-900/10 p-3 sm:grid-cols-4">
                  <Input
                    type="date"
                    value={s.date}
                    onChange={(e) => updateSession(i, { date: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={s.startTime}
                    onChange={(e) => updateSession(i, { startTime: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={s.endTime}
                    onChange={(e) => updateSession(i, { endTime: e.target.value })}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeSessionRow(i)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-800 hover:bg-emerald-900"
              disabled={saving}
              onClick={save}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
