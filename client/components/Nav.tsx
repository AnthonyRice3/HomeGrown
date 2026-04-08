"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export interface NavUser {
  name: string;
  email: string;
  userId?: string;
}

interface NavProps {
  user: NavUser | null;
  onOpenAuth: (mode: "signin" | "signup") => void;
  onSignOut: () => void;
}

const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
  { label: "Gallery", href: "#gallery" },
];

export default function Nav({ user, onOpenAuth, onSignOut }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? "bg-black/95 backdrop-blur-sm border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center">
            <span className="text-black font-black text-sm">HG</span>
          </div>
          <span className="font-bold text-white tracking-tight hidden sm:block">
            Home<span className="text-amber-400">Grown</span>
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-30 truncate">{user.name.split(" ")[0]}</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-xs text-white/50 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); onSignOut(); }}
                    className="w-full text-left px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => onOpenAuth("signin")}
                className="text-sm text-white/70 hover:text-white font-medium transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => onOpenAuth("signup")}
                className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-4 py-2 rounded-full transition-colors"
              >
                Join Free
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-white/70 hover:text-white"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <div className="w-5 flex flex-col gap-1.5">
            <span className={`block h-0.5 bg-current transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 bg-current transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 bg-current transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="text-white/70 hover:text-white font-medium"
            >
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2 border-t border-white/10">
            {user ? (
              <button
                onClick={() => { setMobileOpen(false); onSignOut(); }}
                className="text-sm text-white/70 hover:text-white"
              >
                Sign out ({user.name.split(" ")[0]})
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setMobileOpen(false); onOpenAuth("signin"); }}
                  className="text-sm text-white/70 hover:text-white font-medium"
                >
                  Sign in
                </button>
                <button
                  onClick={() => { setMobileOpen(false); onOpenAuth("signup"); }}
                  className="bg-amber-500 text-black text-sm font-bold px-4 py-2 rounded-full"
                >
                  Join Free
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
