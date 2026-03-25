"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, User, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "./ui/button";

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <nav className="bg-green-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center font-bold text-lg text-white">
                RB
              </div>
              <span className="text-xl font-bold hidden sm:block">Rugby Buddy</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
              Home
            </Link>
            <Link href="/bookings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
              Bookings
            </Link>
            <Link href="/media" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
              Media
            </Link>
            <Link href="/profile/coach" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
              Charlie
            </Link>
            <Link href="/contact" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
              Contact
            </Link>

            {session ? (
              <>
                <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="px-3 py-2 rounded-md text-sm font-medium bg-amber-600 hover:bg-amber-700 transition-colors">
                    <Shield className="w-4 h-4 inline mr-1" />
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-green-700">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" size="sm">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-green-900 border-t border-green-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700" onClick={() => setMobileOpen(false)}>
              Home
            </Link>
            <Link href="/bookings" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700" onClick={() => setMobileOpen(false)}>
              Bookings
            </Link>
            <Link href="/media" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700" onClick={() => setMobileOpen(false)}>
              Media
            </Link>
            <Link href="/profile/coach" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700" onClick={() => setMobileOpen(false)}>
              Charlie
            </Link>
            <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700" onClick={() => setMobileOpen(false)}>
              Contact
            </Link>
            {session ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard className="w-4 h-4 inline mr-2" />Dashboard
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="block px-3 py-2 rounded-md text-base font-medium bg-amber-600 hover:bg-amber-700" onClick={() => setMobileOpen(false)}>
                    <Shield className="w-4 h-4 inline mr-2" />Admin
                  </Link>
                )}
                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-green-700"
                >
                  <LogOut className="w-4 h-4 inline mr-2" />Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700" onClick={() => setMobileOpen(false)}>
                  <User className="w-4 h-4 inline mr-2" />Sign In
                </Link>
                <Link href="/register" className="block px-3 py-2 rounded-md text-base font-medium bg-amber-600 hover:bg-amber-700" onClick={() => setMobileOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
