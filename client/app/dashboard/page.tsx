"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BookingModal from "@/components/BookingModal";
import PayModal from "@/components/PayModal";
import { SERVICES, SERVICE_CATEGORIES, type Service } from "@/lib/services";
import type { SagahBooking } from "@/lib/sagah";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StoredUser {
  name: string;
  email: string;
  userId?: string;
}

const ALL_SERVICES: Service[] = SERVICE_CATEGORIES.flatMap((cat) => SERVICES[cat]);

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function isPast(dateStr: string) {
  return new Date(dateStr + "T00:00:00") < new Date(new Date().toDateString());
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [bookings, setBookings] = useState<SagahBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  // Modals
  const [showBooking, setShowBooking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Contact
  const [contactMsg, setContactMsg] = useState("");
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // Active section tab
  const [activeTab, setActiveTab] = useState<"bookings" | "services" | "contact">("bookings");

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem("hg_user");
      if (!stored) { router.replace("/"); return; }
      const parsed = JSON.parse(stored) as StoredUser;
      if (!parsed?.email) { router.replace("/"); return; }
      setUser(parsed);
    } catch {
      router.replace("/");
    }
  }, [router]);

  // ── Fetch bookings ────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async (email: string) => {
    setBookingsLoading(true);
    try {
      const res = await fetch(`/api/dashboard?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json() as { bookings: SagahBooking[] };
        setBookings(data.bookings ?? []);
      }
    } catch { /* silently fail — bookings section shows empty state */ }
    finally { setBookingsLoading(false); }
  }, []);

  useEffect(() => {
    if (user?.email) fetchBookings(user.email);
  }, [user, fetchBookings]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function signOut() {
    try { localStorage.removeItem("hg_user"); } catch { /* ignore */ }
    router.replace("/");
  }

  function openBooking(service?: Service) {
    setSelectedService(service ?? null);
    setShowBooking(true);
  }

  function openPayment(service: Service) {
    setSelectedService(service);
    setShowPayment(true);
  }

  function reBook(booking: SagahBooking) {
    const match = ALL_SERVICES.find(
      (s) => s.title.toLowerCase() === booking.service.toLowerCase()
    );
    openBooking(match);
  }

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !contactMsg.trim()) return;
    setContactStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          message: contactMsg.trim(),
        }),
      });
      setContactStatus(res.ok ? "sent" : "error");
      if (res.ok) setContactMsg("");
    } catch {
      setContactStatus("error");
    }
  }

  // ── Split bookings ────────────────────────────────────────────────────────
  const upcoming = bookings.filter((b) => !isPast(b.date));
  const past = bookings.filter((b) => isPast(b.date));

  if (!user) return null; // waiting for auth check

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Top bar ──────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-black/95 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center">
              <span className="text-black font-black text-sm">HG</span>
            </div>
            <span className="font-bold text-white tracking-tight hidden sm:block">
              Home<span className="text-amber-400">Grown</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-white/70 hidden sm:block">{user.name.split(" ")[0]}</span>
            </div>
            <button
              onClick={signOut}
              className="text-xs text-white/40 hover:text-white/80 transition-colors border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* ── Welcome ──────────────────────────────────────────── */}
        <div className="mb-10">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">Member Dashboard</p>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            Welcome back, {user.name.split(" ")[0]}.
          </h1>
          <p className="text-white/50 mt-1 text-sm">{user.email}</p>
        </div>

        {/* ── Stats ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Bookings", value: bookingsLoading ? "—" : bookings.length.toString() },
            { label: "Upcoming", value: bookingsLoading ? "—" : upcoming.length.toString() },
            { label: "Completed", value: bookingsLoading ? "—" : past.length.toString() },
            { label: "Services Available", value: ALL_SERVICES.length.toString() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4">
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-xs text-white/50 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Quick actions ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-10">
          <button
            onClick={() => { openBooking(); setActiveTab("bookings"); }}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-full text-sm transition-colors shadow-lg shadow-amber-500/20"
          >
            + Book a Session
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className="border border-white/20 hover:border-amber-400 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
          >
            Browse Services
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className="border border-white/20 hover:border-amber-400 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
          >
            Message Trainer
          </button>
        </div>

        {/* ── Tab navigation ───────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-zinc-950 border border-white/10 rounded-xl mb-8 w-fit">
          {(["bookings", "services", "contact"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "bg-amber-500 text-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {tab === "bookings" ? "My Bookings" : tab === "services" ? "Services" : "Contact"}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            TAB: MY BOOKINGS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "bookings" && (
          <div className="space-y-8">
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-20 text-white/30 text-sm">
                Loading your bookings…
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-white/50 text-sm">No bookings yet.</p>
                <button
                  onClick={() => openBooking()}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-full text-sm transition-colors"
                >
                  Book Your First Session
                </button>
              </div>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <section>
                    <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">Upcoming</h2>
                    <BookingList bookings={upcoming} onRebook={reBook} isPast={false} />
                  </section>
                )}
                {past.length > 0 && (
                  <section>
                    <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Past Sessions</h2>
                    <BookingList bookings={past} onRebook={reBook} isPast={true} />
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: SERVICES
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "services" && (
          <div className="space-y-10">
            {SERVICE_CATEGORIES.map((cat) => (
              <section key={cat}>
                <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4">{cat}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {SERVICES[cat].map((service) => (
                    <div
                      key={service.id}
                      className="bg-zinc-950 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:border-amber-400/30 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-base mb-1">{service.title}</h3>
                        <p className="text-white/50 text-sm leading-relaxed">{service.desc}</p>
                      </div>
                      <div className="flex items-end justify-between gap-4 pt-2 border-t border-white/5">
                        <div>
                          <p className="text-amber-400 font-bold text-sm">{service.price}</p>
                          <p className="text-white/40 text-xs mt-0.5">{service.duration}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openBooking(service)}
                            className="border border-white/20 hover:border-amber-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                          >
                            Book
                          </button>
                          <button
                            onClick={() => openPayment(service)}
                            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                          >
                            Pay Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: CONTACT
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "contact" && (
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-white">Message Fitbaee</h2>
                <p className="text-white/40 text-xs">We'll respond within 24 hours.</p>
              </div>
            </div>

            {contactStatus === "sent" ? (
              <div className="bg-zinc-950 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-bold text-white">Message sent!</h3>
                <p className="text-white/50 text-sm">We'll be in touch soon, {user.name.split(" ")[0]}.</p>
                <button
                  onClick={() => setContactStatus("idle")}
                  className="text-amber-400 text-sm hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContact} className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
                {/* Pre-filled read-only sender info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">From (name)</label>
                    <div className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/40 text-sm select-none">
                      {user.name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">From (email)</label>
                    <div className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/40 text-sm truncate select-none">
                      {user.email}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Message</label>
                  <textarea
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    placeholder="Ask about a programme, your schedule, goals, or anything else…"
                    required
                    rows={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors text-sm resize-none"
                  />
                </div>

                {contactStatus === "error" && (
                  <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                    Could not send. Please try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={contactStatus === "sending" || !contactMsg.trim()}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-bold py-3.5 rounded-xl transition-colors text-sm"
                >
                  {contactStatus === "sending" ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}

            {/* Direct email fallback */}
            <div className="mt-6 flex items-center gap-3 text-white/40 text-sm">
              <svg className="w-4 h-4 text-amber-400/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Or email directly: <a href="mailto:info@homegrown.fit" className="text-amber-400 hover:underline">info@homegrown.fit</a>
            </div>
          </div>
        )}
      </main>

      {/* ── Modals ────────────────────────────────────────────── */}
      {showBooking && (
        <BookingModal
          service={selectedService}
          user={user}
          onClose={() => setShowBooking(false)}
        />
      )}
      {showPayment && selectedService && (
        <PayModal
          service={selectedService}
          user={user}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}

// ─── Booking list sub-component ───────────────────────────────────────────────
function BookingList({
  bookings,
  onRebook,
  isPast: past,
}: {
  bookings: SagahBooking[];
  onRebook: (b: SagahBooking) => void;
  isPast: boolean;
}) {
  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <div
          key={b.bookingId}
          className={`flex items-center justify-between gap-4 rounded-2xl px-6 py-4 border ${
            past
              ? "bg-zinc-950/50 border-white/5"
              : "bg-zinc-950 border-white/10"
          }`}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${past ? "bg-white/20" : "bg-amber-400"}`} />
            <div className="min-w-0">
              <p className={`font-semibold text-sm truncate ${past ? "text-white/50" : "text-white"}`}>
                {b.service}
              </p>
              <p className="text-white/40 text-xs mt-0.5">
                {formatDate(b.date)} · {b.time}
              </p>
            </div>
          </div>
          <button
            onClick={() => onRebook(b)}
            className={`shrink-0 text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors ${
              past
                ? "border border-white/15 text-white/50 hover:text-white hover:border-amber-400"
                : "border border-amber-400/40 text-amber-400 hover:bg-amber-400/10"
            }`}
          >
            {past ? "Re-book" : "Modify"}
          </button>
        </div>
      ))}
    </div>
  );
}
