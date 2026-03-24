"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AgeGroupRef = { id: string; name: string } | null;

type ChildRow = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ageGroup: AgeGroupRef;
};

type ProfilePayload = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile: string | null;
  children: ChildRow[];
};

function formatDisplayDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  const [children, setChildren] = useState<ChildRow[]>([]);

  const [profileErrors, setProfileErrors] = useState<Partial<Record<string, string>>>({});
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [childFirstName, setChildFirstName] = useState("");
  const [childLastName, setChildLastName] = useState("");
  const [childDob, setChildDob] = useState("");
  const [childErrors, setChildErrors] = useState<Partial<Record<string, string>>>({});
  const [childMessage, setChildMessage] = useState<string | null>(null);
  const [addingChild, setAddingChild] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(typeof data.error === "string" ? data.error : "Could not load profile");
        return;
      }
      const p = data as ProfilePayload;
      setFirstName(p.firstName ?? "");
      setLastName(p.lastName ?? "");
      setEmail(p.email ?? "");
      setMobile(p.mobile ?? "");
      setChildren(Array.isArray(p.children) ? p.children : []);
    } catch {
      setLoadError("Could not load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function validateProfile() {
    const e: Partial<Record<string, string>> = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!lastName.trim()) e.lastName = "Required";
    if (!email.trim()) e.email = "Required";
    setProfileErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSaveProfile(ev: React.FormEvent) {
    ev.preventDefault();
    setProfileMessage(null);
    if (!validateProfile()) return;

    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          mobile: mobile.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileMessage(typeof data.error === "string" ? data.error : "Update failed");
        return;
      }
      const p = data as ProfilePayload;
      setFirstName(p.firstName ?? "");
      setLastName(p.lastName ?? "");
      setEmail(p.email ?? "");
      setMobile(p.mobile ?? "");
      setChildren(Array.isArray(p.children) ? p.children : []);
      setProfileMessage("Profile saved successfully.");
    } catch {
      setProfileMessage("Something went wrong.");
    } finally {
      setSavingProfile(false);
    }
  }

  function validateChildForm() {
    const e: Partial<Record<string, string>> = {};
    if (!childFirstName.trim()) e.childFirstName = "Required";
    if (!childLastName.trim()) e.childLastName = "Required";
    if (!childDob) e.childDob = "Required";
    setChildErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleAddChild(ev: React.FormEvent) {
    ev.preventDefault();
    setChildMessage(null);
    if (!validateChildForm()) return;

    setAddingChild(true);
    try {
      const res = await fetch("/api/profile/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: childFirstName.trim(),
          lastName: childLastName.trim(),
          dateOfBirth: childDob,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setChildMessage(typeof data.error === "string" ? data.error : "Could not add child");
        return;
      }
      const row = data as ChildRow;
      setChildren((prev) => [...prev, row]);
      setChildFirstName("");
      setChildLastName("");
      setChildDob("");
      setChildMessage("Child added.");
    } catch {
      setChildMessage("Something went wrong.");
    } finally {
      setAddingChild(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-[#2D5F2D]/15 bg-card p-8 text-center text-muted-foreground">
        Loading your profile…
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800">Unable to load profile</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button type="button" variant="default" onClick={() => void loadProfile()}>
            Try again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-[#2D5F2D]">My profile</h1>
        <p className="mt-1 text-muted-foreground">
          Keep your contact details up to date and manage your children.
        </p>
      </div>

      <Card className="border-[#2D5F2D]/20 shadow-sm">
        <CardHeader className="border-b border-[#2D5F2D]/10 bg-[#2D5F2D]/5">
          <CardTitle className="text-[#2D5F2D]">Your details</CardTitle>
          <CardDescription>These details are used for bookings and messages.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveProfile}>
          <CardContent className="space-y-4 pt-6">
            {profileMessage && (
              <div
                role="status"
                className={
                  profileMessage.includes("success")
                    ? "rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900"
                    : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                }
              >
                {profileMessage}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-firstName">First name</Label>
                <Input
                  id="p-firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={profileErrors.firstName ? "border-red-400" : "border-[#2D5F2D]/25"}
                />
                {profileErrors.firstName && (
                  <p className="text-xs text-red-600">{profileErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-lastName">Last name</Label>
                <Input
                  id="p-lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={profileErrors.lastName ? "border-red-400" : "border-[#2D5F2D]/25"}
                />
                {profileErrors.lastName && (
                  <p className="text-xs text-red-600">{profileErrors.lastName}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-email">Email</Label>
              <Input
                id="p-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={profileErrors.email ? "border-red-400" : "border-[#2D5F2D]/25"}
              />
              {profileErrors.email && <p className="text-xs text-red-600">{profileErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-mobile">Mobile</Label>
              <Input
                id="p-mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="border-[#2D5F2D]/25"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t border-[#2D5F2D]/10 bg-muted/20">
            <Button type="submit" variant="default" disabled={savingProfile}>
              {savingProfile ? "Saving…" : "Save changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="border-[#2D5F2D]/20 shadow-sm">
        <CardHeader className="border-b border-[#2D5F2D]/10 bg-[#2D5F2D]/5">
          <CardTitle className="text-[#2D5F2D]">Children</CardTitle>
          <CardDescription>
            Each child can be assigned to an age group by an admin when you book sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground">No children on file yet. Add one below.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-[#2D5F2D]/15">
              {children.map((c) => (
                <li key={c.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Born {formatDisplayDate(c.dateOfBirth)}
                      {c.ageGroup?.name ? (
                        <>
                          {" "}
                          · <span className="text-[#2D5F2D] font-medium">{c.ageGroup.name}</span>
                        </>
                      ) : (
                        <> · Age group not assigned</>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-xl border border-dashed border-[#D4A843]/50 bg-[#D4A843]/5 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-[#2D5F2D] mb-3">Add a child</h3>
            <form onSubmit={handleAddChild} className="space-y-4">
              {childMessage && (
                <div
                  role="status"
                  className={
                    childMessage.includes("added")
                      ? "rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900"
                      : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  }
                >
                  {childMessage}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="c-firstName">First name</Label>
                  <Input
                    id="c-firstName"
                    value={childFirstName}
                    onChange={(e) => setChildFirstName(e.target.value)}
                    className={childErrors.childFirstName ? "border-red-400" : "border-[#2D5F2D]/25"}
                  />
                  {childErrors.childFirstName && (
                    <p className="text-xs text-red-600">{childErrors.childFirstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-lastName">Last name</Label>
                  <Input
                    id="c-lastName"
                    value={childLastName}
                    onChange={(e) => setChildLastName(e.target.value)}
                    className={childErrors.childLastName ? "border-red-400" : "border-[#2D5F2D]/25"}
                  />
                  {childErrors.childLastName && (
                    <p className="text-xs text-red-600">{childErrors.childLastName}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="c-dob">Date of birth</Label>
                <Input
                  id="c-dob"
                  type="date"
                  value={childDob}
                  onChange={(e) => setChildDob(e.target.value)}
                  className={childErrors.childDob ? "border-red-400" : "border-[#2D5F2D]/25"}
                />
                {childErrors.childDob && (
                  <p className="text-xs text-red-600">{childErrors.childDob}</p>
                )}
              </div>
              <Button type="submit" variant="default" disabled={addingChild}>
                {addingChild ? "Adding…" : "Add child"}
              </Button>
            </form>
          </div>
        </CardContent>
        <CardFooter className="border-t border-muted text-sm text-muted-foreground">
          <Link href="/dashboard" className="text-[#2D5F2D] font-medium hover:underline">
            ← Back to dashboard
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
