"use client";

import { useState, type CSSProperties } from "react";
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

const grassStyle: CSSProperties = {
  backgroundColor: "#1e4a1e",
  backgroundImage: `
    repeating-linear-gradient(
      -45deg,
      rgba(45, 95, 45, 0.35) 0px,
      rgba(45, 95, 45, 0.35) 2px,
      transparent 2px,
      transparent 10px
    ),
    repeating-linear-gradient(
      45deg,
      rgba(0, 0, 0, 0.06) 0px,
      rgba(0, 0, 0, 0.06) 1px,
      transparent 1px,
      transparent 14px
    ),
    linear-gradient(180deg, rgba(45, 95, 45, 0.25) 0%, rgba(30, 74, 30, 0.9) 100%)
  `,
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12" style={grassStyle}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg border-2 border-white/20"
            style={{ backgroundColor: "#D4A843" }}
            aria-hidden
          >
            RB
          </div>
          <p className="mt-3 text-sm font-medium text-white/90 tracking-wide">Rugby Buddy</p>
        </div>

        <Card className="border-[#2D5F2D]/20 shadow-xl">
          <CardHeader className="space-y-1 border-b border-[#2D5F2D]/10 bg-[#2D5F2D]/5">
            <CardTitle className="text-2xl font-heading text-[#2D5F2D]">Welcome back</CardTitle>
            <CardDescription>Sign in to manage bookings, messages, and your profile.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="border-[#2D5F2D]/25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-[#2D5F2D]/25"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t border-[#2D5F2D]/10 bg-muted/30">
              <Button type="submit" variant="default" className="w-full" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                New to Rugby Buddy?{" "}
                <Link href="/register" className="font-medium text-[#2D5F2D] hover:underline">
                  Create an account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
