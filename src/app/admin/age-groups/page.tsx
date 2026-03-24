"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AgeGroup = {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
  sortOrder: number;
};

const emptyForm = { name: "", minAge: "", maxAge: "", sortOrder: "0" };

export default function AdminAgeGroupsPage() {
  const [rows, setRows] = useState<AgeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AgeGroup | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/age-groups");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setRows(data);
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
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(row: AgeGroup) {
    setEditing(row);
    setForm({
      name: row.name,
      minAge: String(row.minAge),
      maxAge: String(row.maxAge),
      sortOrder: String(row.sortOrder),
    });
    setDialogOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        minAge: Number(form.minAge),
        maxAge: Number(form.maxAge),
        sortOrder: Number(form.sortOrder) || 0,
      };
      const url = editing ? `/api/admin/age-groups/${editing.id}` : "/api/admin/age-groups";
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
    if (!confirm("Delete this age group?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/age-groups/${id}`, { method: "DELETE" });
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
          <h1 className="text-3xl font-bold text-emerald-950">Age groups</h1>
          <p className="text-emerald-800/80">Manage programme age bands.</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-800 hover:bg-emerald-900">
          <Plus className="mr-2 h-4 w-4" />
          Add age group
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <Card className="border-emerald-900/10">
        <CardHeader>
          <CardTitle className="text-emerald-950">All age groups</CardTitle>
          <CardDescription>Sorted by display order</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No age groups yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-emerald-900/10 text-emerald-900/70">
                    <th className="pb-3 pr-4 font-semibold">Name</th>
                    <th className="pb-3 pr-4 font-semibold">Min age</th>
                    <th className="pb-3 pr-4 font-semibold">Max age</th>
                    <th className="pb-3 pr-4 font-semibold">Sort</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-emerald-900/5">
                      <td className="py-3 pr-4 font-medium text-emerald-950">{r.name}</td>
                      <td className="py-3 pr-4">{r.minAge}</td>
                      <td className="py-3 pr-4">{r.maxAge}</td>
                      <td className="py-3 pr-4">{r.sortOrder}</td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeRow(r.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-emerald-900/20">
          <DialogHeader>
            <DialogTitle className="text-emerald-950">
              {editing ? "Edit age group" : "New age group"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ag-name">Name</Label>
              <Input
                id="ag-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ag-min">Min age</Label>
                <Input
                  id="ag-min"
                  type="number"
                  value={form.minAge}
                  onChange={(e) => setForm((f) => ({ ...f, minAge: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ag-max">Max age</Label>
                <Input
                  id="ag-max"
                  type="number"
                  value={form.maxAge}
                  onChange={(e) => setForm((f) => ({ ...f, maxAge: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ag-sort">Sort order</Label>
              <Input
                id="ag-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
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
