"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatDate } from "@/lib/utils";

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ageGroup: { id: string; name: string } | null;
};

type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile: string | null;
  role: string;
  isActive: boolean;
  children: Child[];
};

export default function AdminUsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [ageGroupId, setAgeGroupId] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [ageGroupList, setAgeGroupList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/age-groups");
        const data = await res.json();
        if (res.ok) setAgeGroupList(data);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (ageGroupId !== "all") params.set("ageGroupId", ageGroupId);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, ageGroupId]);

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  async function toggleActive(user: UserRow) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setRows((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: data.isActive } : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-950">Users</h1>
        <p className="text-emerald-800/80">Parents, children, and access.</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <Card className="border-emerald-900/10">
        <CardHeader>
          <CardTitle className="text-emerald-950">Search & filter</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 space-y-2">
            <Label>Name or email</Label>
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full space-y-2 sm:w-56">
            <Label>Age group (child)</Label>
            <Select value={ageGroupId} onValueChange={setAgeGroupId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {ageGroupList.map((ag) => (
                  <SelectItem key={ag.id} value={ag.id}>
                    {ag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-900/10">
        <CardHeader>
          <CardTitle className="text-emerald-950">Directory</CardTitle>
          <CardDescription>{loading ? "Loading…" : `${rows.length} users`}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-emerald-900/10 text-emerald-900/70">
                    <th className="w-8 pb-3" />
                    <th className="pb-3 pr-3 font-semibold">Name</th>
                    <th className="pb-3 pr-3 font-semibold">Email</th>
                    <th className="pb-3 pr-3 font-semibold">Mobile</th>
                    <th className="pb-3 pr-3 font-semibold">Children</th>
                    <th className="pb-3 pr-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => {
                    const open = expanded[u.id];
                    return (
                      <Fragment key={u.id}>
                        <tr className="border-b border-emerald-900/5">
                          <td className="py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setExpanded((e) => ({ ...e, [u.id]: !e[u.id] }))}
                              aria-expanded={open}
                            >
                              {open ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                          <td className="py-2 pr-3 font-medium text-emerald-950">
                            {u.firstName} {u.lastName}
                          </td>
                          <td className="py-2 pr-3">{u.email}</td>
                          <td className="py-2 pr-3">{u.mobile ?? "—"}</td>
                          <td className="py-2 pr-3">{u.children.length}</td>
                          <td className="py-2 pr-3">
                            <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                          </td>
                          <td className="py-2">
                            <Button variant="outline" size="sm" onClick={() => toggleActive(u)}>
                              {u.isActive ? (
                                <span className="text-emerald-800">Active</span>
                              ) : (
                                <span className="text-muted-foreground">Suspended</span>
                              )}
                            </Button>
                          </td>
                        </tr>
                        {open && (
                          <tr className="border-b border-emerald-900/10 bg-emerald-50/50">
                            <td colSpan={7} className="px-4 py-3">
                              <p className="mb-2 text-xs font-semibold uppercase text-emerald-900/60">
                                Children
                              </p>
                              {u.children.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No children on file.</p>
                              ) : (
                                <ul className="space-y-2 text-sm">
                                  {u.children.map((c) => (
                                    <li key={c.id} className="rounded-md border border-emerald-900/10 bg-white px-3 py-2">
                                      <span className="font-medium">
                                        {c.firstName} {c.lastName}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {" "}
                                        · DOB {formatDate(c.dateOfBirth)}
                                        {c.ageGroup ? ` · ${c.ageGroup.name}` : ""}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
