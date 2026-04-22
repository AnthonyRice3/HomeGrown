"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, useClerk, SignInButton, SignUpButton } from "@clerk/nextjs";

const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
  { label: "Gallery", href: "#gallery" },
];

export default function Nav() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const displayName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    (user?.primaryEmailAddress?.emailAddress ?? "");
  const initial = displayName.charAt(0).toUpperCase();

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
          {isSignedIn ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-xs">
                  {initial}
                </div>
                <span className="max-w-30 truncate">{user?.firstName ?? displayName.split(" ")[0]}</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-xs text-white/50 truncate">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    My Dashboard
                  </Link>
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut(() => { window.location.href = "/"; }); }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-sm text-white/70 hover:text-white font-medium transition-colors">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-4 py-2 rounded-full transition-colors">
                  Join Free
                </button>
              </SignUpButton>
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
            {isSignedIn ? (
              <div className="flex flex-col gap-2 w-full">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-semibold text-amber-400 hover:text-amber-300"
                >
                  My Dashboard
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); signOut(() => { window.location.href = "/"; }); }}
                  className="text-sm text-white/50 hover:text-white text-left"
                >
                  Sign out ({user?.firstName ?? displayName.split(" ")[0]})
                </button>
              </div>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-white/70 hover:text-white font-medium"
                  >
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="bg-amber-500 text-black text-sm font-bold px-4 py-2 rounded-full"
                  >
                    Join Free
                  </button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

