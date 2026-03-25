"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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

type FieldErrors = Partial<Record<string, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [childFirstName, setChildFirstName] = useState("");
  const [childLastName, setChildLastName] = useState("");
  const [childDateOfBirth, setChildDateOfBirth] = useState("");

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!firstName.trim()) next.firstName = "First name is required";
    if (!lastName.trim()) next.lastName = "Last name is required";
    if (!email.trim()) next.email = "Email is required";
    if (!password) next.password = "Password is required";
    if (password.length < 8) next.password = "Use at least 8 characters";
    if (password !== confirmPassword) next.confirmPassword = "Passwords do not match";
    if (!childFirstName.trim()) next.childFirstName = "Child first name is required";
    if (!childLastName.trim()) next.childLastName = "Child last name is required";
    if (!childDateOfBirth) next.childDateOfBirth = "Date of birth is required";

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          mobile: mobile.trim() || null,
          password,
          childFirstName: childFirstName.trim(),
          childLastName: childLastName.trim(),
          childDateOfBirth,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFormError(typeof data.error === "string" ? data.error : "Registration failed");
        return;
      }

      const signResult = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (signResult?.error) {
        setFormError("Account created but sign-in failed. Please sign in manually.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function fieldClass(name: keyof FieldErrors) {
    return fieldErrors[name] ? "border-red-400 focus-visible:ring-red-400" : "border-[#2D5F2D]/25";
  }

  return (
    <div
      className="min-h-[calc(100vh-8rem)] px-4 py-10"
      style={{
        background: `linear-gradient(165deg, #f8faf5 0%, #eef4ea 45%, #e8efe3 100%)`,
      }}
    >
      <div className="max-w-xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md border-2 border-[#2D5F2D]/30"
            style={{ backgroundColor: "#D4A843" }}
            aria-hidden
          >
            RB
          </div>
          <h1 className="mt-3 text-xl font-heading font-bold text-[#2D5F2D]">Join Rugby Buddy</h1>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Register as a parent and add your child to get started with sessions and updates.
          </p>
        </div>

        <Card className="border-[#2D5F2D]/20 shadow-lg overflow-hidden">
          <CardHeader className="space-y-1 border-b border-[#2D5F2D]/10 bg-[#2D5F2D]/5">
            <CardTitle className="text-2xl font-heading text-[#2D5F2D]">Parent registration</CardTitle>
            <CardDescription>We’ll set up your account and your first child in one step.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8 pt-6">
              {formError && (
                <div
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {formError}
                </div>
              )}

              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2D5F2D] flex items-center gap-2">
                  <span className="h-1 w-8 rounded-full bg-[#D4A843]" aria-hidden />
                  Parent details
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={fieldClass("firstName")}
                      autoComplete="given-name"
                    />
                    {fieldErrors.firstName && (
                      <p className="text-xs text-red-600">{fieldErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={fieldClass("lastName")}
                      autoComplete="family-name"
                    />
                    {fieldErrors.lastName && (
                      <p className="text-xs text-red-600">{fieldErrors.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass("email")}
                    autoComplete="email"
                  />
                  {fieldErrors.email && <p className="text-xs text-red-600">{fieldErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile (optional)</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="border-[#2D5F2D]/25"
                    autoComplete="tel"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={fieldClass("password")}
                      autoComplete="new-password"
                    />
                    {fieldErrors.password && (
                      <p className="text-xs text-red-600">{fieldErrors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={fieldClass("confirmPassword")}
                      autoComplete="new-password"
                    />
                    {fieldErrors.confirmPassword && (
                      <p className="text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2D5F2D] flex items-center gap-2">
                  <span className="h-1 w-8 rounded-full bg-[#D4A843]" aria-hidden />
                  Child details
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="childFirstName">Child first name</Label>
                    <Input
                      id="childFirstName"
                      value={childFirstName}
                      onChange={(e) => setChildFirstName(e.target.value)}
                      className={fieldClass("childFirstName")}
                    />
                    {fieldErrors.childFirstName && (
                      <p className="text-xs text-red-600">{fieldErrors.childFirstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="childLastName">Child last name</Label>
                    <Input
                      id="childLastName"
                      value={childLastName}
                      onChange={(e) => setChildLastName(e.target.value)}
                      className={fieldClass("childLastName")}
                    />
                    {fieldErrors.childLastName && (
                      <p className="text-xs text-red-600">{fieldErrors.childLastName}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childDateOfBirth">Date of birth</Label>
                  <Input
                    id="childDateOfBirth"
                    type="date"
                    value={childDateOfBirth}
                    onChange={(e) => setChildDateOfBirth(e.target.value)}
                    className={fieldClass("childDateOfBirth")}
                  />
                  {fieldErrors.childDateOfBirth && (
                    <p className="text-xs text-red-600">{fieldErrors.childDateOfBirth}</p>
                  )}
                </div>
              </section>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t border-[#2D5F2D]/10 bg-muted/30">
              <Button type="submit" variant="default" className="w-full" disabled={submitting}>
                {submitting ? "Creating account…" : "Create account"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already registered?{" "}
                <Link href="/login" className="font-medium text-[#2D5F2D] hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
