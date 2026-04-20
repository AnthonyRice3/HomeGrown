"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";

function formatDate(d: string) {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

// ─── Inner component (uses useSearchParams) ───────────────────────────────────
function BookingConfirmedContent() {
  const router = useRouter();
  const params = useSearchParams();
  const service = params.get("service") ?? "";
  const date = params.get("date") ?? "";
  const time = params.get("time") ?? "";
  const name = params.get("name") ?? "";
  const email = params.get("email") ?? "";
  // "booked=1" is set when the inline Stripe success path already called /api/book
  const alreadyBooked = params.get("booked") === "1";

  const [status, setStatus] = useState<"loading" | "done" | "error">(
    alreadyBooked ? "done" : "loading"
  );
  const hasFired = useRef(false);

  // 3DS redirect path — the modal wasn't able to call /api/book, so we do it here
  useEffect(() => {
    if (alreadyBooked || hasFired.current) return;
    if (!service || !date || !time || !name || !email) { setStatus("done"); return; }
    hasFired.current = true;

    fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, service, date, time }),
    })
      .then((r) => setStatus(r.ok ? "done" : "error"))
      .catch(() => setStatus("error"));
  }, [alreadyBooked, service, date, time, name, email]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Nav bar */}
      <header className="border-b border-white/10 bg-black/95 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center">
              <span className="text-black font-black text-sm">HG</span>
            </div>
            <span className="font-bold text-white tracking-tight hidden sm:block">
              Home<span className="text-amber-400">Grown</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">

          {/* Loading spinner while creating booking (3DS path) */}
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
              <p className="text-white/50 text-sm">Confirming your booking…</p>
            </div>
          )}

          {/* Success state */}
          {status === "done" && (
            <>
              <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
                Booking Confirmed
              </p>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                You&apos;re all set{name ? `, ${name.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-white/50 text-base mb-8">
                Your session has been booked and a confirmation email is on its way to{" "}
                <span className="text-amber-400">{email}</span>.
              </p>

              {/* Booking details card */}
              {service && (
                <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 text-left space-y-4 mb-8">
                  <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Session Details</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-sm">Service</span>
                      <span className="text-white font-semibold text-sm">{service}</span>
                    </div>
                    {date && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 text-sm">Date</span>
                        <span className="text-white font-semibold text-sm">{formatDate(date)}</span>
                      </div>
                    )}
                    {time && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 text-sm">Time</span>
                        <span className="text-white font-semibold text-sm">{time}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => { router.refresh(); router.push("/dashboard"); }}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3.5 rounded-full transition-colors text-sm"
                >
                  View My Dashboard
                </button>
                <Link
                  href="/"
                  className="border border-white/20 hover:border-white text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-sm"
                >
                  Back to Home
                </Link>
              </div>
            </>
          )}

          {/* Error state */}
          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-white mb-2">Payment received!</h1>
              <p className="text-white/50 text-sm mb-6">
                Your payment went through. We had trouble saving the booking automatically —
                please email us at{" "}
                <a href="mailto:info@homegrown.fit" className="text-amber-400 hover:underline">
                  info@homegrown.fit
                </a>{" "}
                with your session details and we&apos;ll confirm manually.
              </p>
              <Link
                href="/"
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3.5 rounded-full transition-colors text-sm inline-block"
              >
                Back to Home
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Page wrapper (Suspense required for useSearchParams) ─────────────────────
export default function BookingConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
        </div>
      }
    >
      <BookingConfirmedContent />
    </Suspense>
  );
}
