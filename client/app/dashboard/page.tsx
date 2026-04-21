"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BookingModal from "@/components/BookingModal";
import { SERVICES, SERVICE_CATEGORIES, type Service } from "@/lib/services";
import type { SagahBooking, SagahMessage } from "@/lib/sagah";

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
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Messaging
  const [messages, setMessages] = useState<SagahMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [msgInput, setMsgInput] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  // Re-fetch bookings when the tab regains focus (e.g. returning via back button)
  useEffect(() => {
    if (!user?.email) return;
    function onVisible() {
      if (document.visibilityState === "visible") fetchBookings(user!.email);
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
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

  function reBook(booking: SagahBooking) {
    const match = ALL_SERVICES.find(
      (s) => s.title.toLowerCase() === booking.service.toLowerCase()
    );
    openBooking(match);
  }

  // ── Fetch messages ────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (email: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/messages?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json() as { messages: SagahMessage[] };
        setMessages(data.messages ?? []);
      }
    } catch { /* silently fail */ }
    finally { setMessagesLoading(false); }
  }, []);

  // Fetch messages when switching to contact tab
  useEffect(() => {
    if (activeTab === "contact" && user?.email) fetchMessages(user.email);
  }, [activeTab, user, fetchMessages]);

  // Poll for new replies every 15 s while on contact tab
  useEffect(() => {
    if (activeTab !== "contact" || !user?.email) return;
    const id = setInterval(() => fetchMessages(user.email), 15_000);
    return () => clearInterval(id);
  }, [activeTab, user, fetchMessages]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !msgInput.trim() || msgSending) return;
    setMsgSending(true);
    setMsgError(null);
    const text = msgInput.trim();
    setMsgInput("");
    // Optimistically append
    const optimistic: SagahMessage = {
      _id: `opt-${Date.now()}`,
      userEmail: user.email,
      userName: user.name,
      from: "user",
      text,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, name: user.name, text, userId: user.userId }),
      });
      if (!res.ok) throw new Error("send failed");
      // Re-fetch to get the server-assigned _id and any new replies
      await fetchMessages(user.email);
    } catch {
      setMsgError("Failed to send. Please try again.");
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setMsgInput(text);
    } finally {
      setMsgSending(false);
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
        {([ "bookings", "services", "contact"] as const).map((tab) => {
            const unread = tab === "contact"
              ? messages.filter((m) => m.from === "client" && !m.read).length
              : 0;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-amber-500 text-black"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {tab === "bookings" ? "My Bookings" : tab === "services" ? "Services" : "Messages"}
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
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
                            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-5 py-2 rounded-lg transition-colors"
                          >
                            Book Session
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
            TAB: MESSAGES
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "contact" && (
          <div className="max-w-xl flex flex-col" style={{ height: "60vh", minHeight: 400 }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-white">Messages with Fitbaee</h2>
                <p className="text-white/40 text-xs">Replies within 24 hours · auto-refreshes every 15 s</p>
              </div>
            </div>

            {/* Thread */}
            <div className="flex-1 overflow-y-auto bg-zinc-950 border border-white/10 rounded-2xl p-4 space-y-3 mb-3">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/30 text-sm">
                  <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin mr-2" />
                  Loading messages…
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                  <svg className="w-10 h-10 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-white/30 text-sm">No messages yet.<br />Send one below to start the conversation.</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m._id}
                    className={`flex ${ m.from === "user" ? "justify-end" : "justify-start" }`}
                  >
                    <div
                      className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        m.from === "user"
                          ? "bg-amber-500 text-black rounded-br-sm"
                          : "bg-zinc-800 text-white rounded-bl-sm"
                      }`}
                    >
                      {m.from === "client" && (
                        <p className="text-xs font-bold text-amber-400 mb-1">Fitbaee</p>
                      )}
                      <p>{m.text}</p>
                      <p className={`text-[10px] mt-1 ${ m.from === "user" ? "text-black/50" : "text-white/30" }`}>
                        {new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        {m.from === "user" && (
                          <span className="ml-1">{m.read ? " ✓✓" : " ✓"}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Send input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                placeholder="Type a message…"
                maxLength={2000}
                disabled={msgSending}
                className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={msgSending || !msgInput.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 text-black font-bold px-5 py-3 rounded-xl transition-colors text-sm shrink-0"
              >
                {msgSending ? (
                  <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin inline-block" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>

            {msgError && (
              <p className="text-red-400 text-xs mt-2 bg-red-400/10 rounded-lg px-3 py-2">{msgError}</p>
            )}
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
