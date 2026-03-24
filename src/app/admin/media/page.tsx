"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { getYouTubeThumbnail } from "@/lib/utils";
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

type MediaType = "VIDEO" | "PHOTO";

type MediaItem = {
  id: string;
  title: string;
  type: MediaType;
  url: string;
  thumbnailUrl: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

function thumbSrc(m: MediaItem): string | null {
  if (m.thumbnailUrl) return m.thumbnailUrl;
  if (m.type === "VIDEO") return getYouTubeThumbnail(m.url);
  return m.url;
}

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "PHOTO" as MediaType,
    url: "",
    thumbnailUrl: "",
    description: "",
    sortOrder: "0",
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setItems(data);
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
      title: "",
      type: "PHOTO",
      url: "",
      thumbnailUrl: "",
      description: "",
      sortOrder: "0",
      isActive: true,
    });
    setDialogOpen(true);
  }

  function openEdit(m: MediaItem) {
    setEditing(m);
    setForm({
      title: m.title,
      type: m.type,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl ?? "",
      description: m.description ?? "",
      sortOrder: String(m.sortOrder),
      isActive: m.isActive,
    });
    setDialogOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        url: form.url.trim(),
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        description: form.description.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        ...(editing ? { isActive: form.isActive } : {}),
      };
      const url = editing ? `/api/admin/media/${editing.id}` : "/api/admin/media";
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

  async function removeItem(id: string) {
    if (!confirm("Delete this media item?")) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function updateSortLocal(id: string, sortOrder: number) {
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)),
    [items]
  );

  async function persistSortOrder(order: MediaItem[]) {
    setReordering(true);
    setError(null);
    try {
      for (let i = 0; i < order.length; i++) {
        const m = order[i];
        const res = await fetch(`/api/admin/media/${m.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: i }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Reorder failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reorder failed");
    } finally {
      setReordering(false);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function reorderAfterDrop(fromId: string, toId: string) {
    if (fromId === toId) return;
    const arr = [...sorted];
    const fromIdx = arr.findIndex((x) => x.id === fromId);
    const toIdx = arr.findIndex((x) => x.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [removed] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, removed);
    void persistSortOrder(arr);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">Media</h1>
          <p className="text-emerald-800/80">Gallery items for the public media page.</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-800 hover:bg-emerald-900">
          <Plus className="mr-2 h-4 w-4" />
          Add media
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <Card className="border-emerald-900/10">
        <CardHeader>
          <CardTitle className="text-emerald-950">Library</CardTitle>
          <CardDescription>
            Drag cards by the handle to reorder, or edit the sort number — gallery uses ascending order.
            {reordering ? " Saving new order…" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((m) => {
                const src = thumbSrc(m);
                return (
                  <div
                    key={m.id}
                    draggable
                    onDragStart={(e) => {
                      setDragId(m.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", m.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                    onDragOver={onDragOver}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = e.dataTransfer.getData("text/plain") || dragId;
                      if (from) reorderAfterDrop(from, m.id);
                    }}
                    className={`overflow-hidden rounded-xl border border-emerald-900/10 bg-white shadow-sm transition-opacity ${
                      dragId === m.id ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1 border-b border-emerald-900/10 bg-emerald-950/[0.03] px-2 py-1">
                      <span
                        className="cursor-grab touch-none text-emerald-800/50 active:cursor-grabbing"
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-5 w-5" />
                      </span>
                      <span className="text-xs text-emerald-900/50">Drag to reorder</span>
                    </div>
                    <div className="relative aspect-video bg-emerald-950/5">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          No preview
                        </div>
                      )}
                      <Badge className="absolute right-2 top-2" variant="secondary">
                        {m.type}
                      </Badge>
                    </div>
                    <div className="space-y-2 p-3">
                      <p className="font-semibold text-emerald-950">{m.title}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <Label className="w-16 shrink-0">Sort</Label>
                        <Input
                          type="number"
                          className="h-8"
                          defaultValue={m.sortOrder}
                          onBlur={(e) => updateSortLocal(m.id, Number(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(m.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-emerald-950">
              {editing ? "Edit media" : "Add media"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as MediaType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHOTO">Photo</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Thumbnail URL</Label>
              <Input
                value={form.thumbnailUrl}
                onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
            {editing && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-emerald-800/40"
                />
                Active (visible on site)
              </label>
            )}
            {form.url && (
              <div className="rounded-md border border-emerald-900/10 p-2">
                <p className="mb-2 text-xs font-medium text-emerald-900/70">Preview</p>
                {thumbSrc({
                  id: "",
                  title: "",
                  type: form.type,
                  url: form.url,
                  thumbnailUrl: form.thumbnailUrl || null,
                  description: null,
                  sortOrder: 0,
                  isActive: true,
                }) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbSrc({
                      id: "",
                      title: "",
                      type: form.type,
                      url: form.url,
                      thumbnailUrl: form.thumbnailUrl || null,
                      description: null,
                      sortOrder: 0,
                      isActive: true,
                    })!}
                    alt=""
                    className="max-h-40 w-full rounded object-cover"
                  />
                ) : null}
              </div>
            )}
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
