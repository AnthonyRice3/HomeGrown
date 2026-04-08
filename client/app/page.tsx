"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Nav, { type NavUser } from "@/components/Nav";
import Services from "@/components/Services";
import AuthModal, { type AuthUser } from "@/components/AuthModal";
import BookingModal from "@/components/BookingModal";
import PayModal from "@/components/PayModal";
import type { Service } from "@/lib/services";

// ─── Types ──────────────────────────────────────────────────────────────────
type User = NavUser & { userId?: string };

const GALLERY = [
  "/gallery/session1.png",
  "/gallery/session2.png",
  "/gallery/session3.png",
  "/gallery/session4.png",
  "/gallery/session5.png",
  "/gallery/Subject.png",
];

// ─── Page ────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [showBooking, setShowBooking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hg_user");
      if (stored) setUser(JSON.parse(stored) as User);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (window.location.search.includes("payment=success")) {
      setPaymentSuccess(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  function handleAuthSuccess(u: AuthUser) {
    const usr: User = { name: u.name, email: u.email, userId: u.userId };
    setUser(usr);
    try { localStorage.setItem("hg_user", JSON.stringify(usr)); } catch { /* ignore */ }
    setShowAuth(false);
  }

  function signOut() {
    setUser(null);
    try { localStorage.removeItem("hg_user"); } catch { /* ignore */ }
  }

  function openAuth(mode: "signin" | "signup") {
    setAuthMode(mode);
    setShowAuth(true);
  }

  function openBooking(service?: Service) {
    setSelectedService(service ?? null);
    setShowBooking(true);
  }

  function openPayment(service: Service) {
    setSelectedService(service);
    setShowPayment(true);
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContactStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: contactName, email: contactEmail, message: contactMsg }),
      });
      setContactStatus(res.ok ? "sent" : "error");
    } catch {
      setContactStatus("error");
    }
  }

  return (
    <>
      <Nav user={user} onOpenAuth={openAuth} onSignOut={signOut} />

      <main className="overflow-x-hidden">
        {paymentSuccess && (
          <div className="fixed top-4 inset-x-4 md:left-1/2 md:-translate-x-1/2 z-50 bg-amber-500 text-black font-bold rounded-2xl px-6 py-3 text-center shadow-xl shadow-amber-500/30 max-w-sm mx-auto">
            Payment successful! Check your email for confirmation.
          </div>
        )}

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section id="home" className="relative h-screen min-h-150 overflow-hidden">
          <video
            src="/herobg.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-[0.3em] mb-5">
              Personal Training &amp; Wellness
            </p>
            <h1 className="text-5xl md:text-7xl xl:text-8xl font-black text-white leading-[1.05] mb-6">
              Train With<br />
              <span className="text-amber-400">Purpose.</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
              Expert coaching for strength, performance, and wholeness.
              Personalised programmes built around your body and your goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <button
                onClick={() => openBooking()}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-10 py-4 rounded-full transition-colors text-base shadow-xl shadow-amber-500/30"
              >
                Book a Session
              </button>
              <a
                href="#services"
                className="border border-white/30 hover:border-white text-white font-semibold px-10 py-4 rounded-full transition-colors text-base"
              >
                View Services
              </a>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
            <span className="text-[10px] tracking-[0.25em] uppercase">Scroll</span>
            <div className="w-px h-10 bg-linear-to-b from-white/30 to-transparent" />
          </div>
        </section>

        {/* ── STATS BAR ─────────────────────────────────────────────────── */}
        <div className="bg-amber-500 text-black">
          <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { value: "200+", label: "Clients Coached" },
              { value: "5+", label: "Years of Experience" },
              { value: "1,000+", label: "Sessions Delivered" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl md:text-4xl font-black">{value}</p>
                <p className="text-sm font-semibold opacity-80 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ABOUT ─────────────────────────────────────────────────────── */}
        <section id="about" className="py-28 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-4/5 relative rounded-3xl overflow-hidden">
                <Image
                  src="/Subject.png"
                  alt="Your coach"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="absolute -bottom-5 -right-5 bg-amber-500 text-black rounded-2xl px-5 py-3 shadow-xl">
                <p className="text-2xl font-black leading-none">5+</p>
                <p className="text-xs font-bold opacity-80 mt-0.5">Years Training</p>
              </div>
            </div>
            <div>
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">Meet Your Coach</p>
              <div className="w-12 h-1 bg-amber-500 mb-6 rounded-full" />
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                Built From the<br />
                <span className="text-amber-400">Ground Up.</span>
              </h2>
              <div className="space-y-4 text-white/60 text-base leading-relaxed">
                <p>
                  HomeGrown Fitness was built on one simple belief: sustainable transformation comes from within.
                  With over five years of hands-on coaching, I&apos;ve helped more than 200 clients go from frustrated
                  to fulfilled — not by following cookie-cutter plans, but by building programmes around real lives.
                </p>
                <p>
                  Whether you&apos;re a first-time gym-goer or a seasoned athlete, my approach combines science-backed
                  training, personalised nutrition, and a whole-person wellness mindset to get you real, lasting results.
                </p>
                <p className="text-white font-medium">Let&apos;s build something great — together.</p>
              </div>
              <button
                onClick={() => openBooking()}
                className="mt-8 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3.5 rounded-full transition-colors"
              >
                Start Your Journey
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* ── SERVICES ──────────────────────────────────────────────────── */}
        <Services onBook={openBooking} onPurchase={openPayment} onOpenAuth={openAuth} isLoggedIn={!!user} />

        {/* ── GALLERY ───────────────────────────────────────────────────── */}
        <section id="gallery" className="py-28 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">In the Gym</p>
              <h2 className="text-4xl md:text-5xl font-black text-white">Real Work. Real Results.</h2>
            </div>
            <div className="columns-2 md:columns-3 gap-4 space-y-4">
              {GALLERY.map((src, i) => (
                <div key={src} className="break-inside-avoid rounded-2xl overflow-hidden">
                  <Image
                    src={src}
                    alt={`Training session ${i + 1}`}
                    width={600}
                    height={800}
                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOOKING CTA ───────────────────────────────────────────────── */}
        <section className="py-28 px-6 bg-zinc-950">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">Ready to Start?</p>
            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              Your Best Self<br />Is One Session Away.
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto mb-10">
              No commitment required for your first session. Pick your programme, choose a time, and let&apos;s get to work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => openBooking()}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-10 py-4 rounded-full transition-colors shadow-xl shadow-amber-500/25 text-base"
              >
                Book Your Session
              </button>
              {!user && (
                <button
                  onClick={() => openAuth("signup")}
                  className="border border-white/20 hover:border-amber-400 text-white font-semibold px-10 py-4 rounded-full transition-colors text-base"
                >
                  Create Free Account
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── CONTACT ───────────────────────────────────────────────────── */}
        <section id="contact" className="py-28 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">Get in Touch</p>
              <h2 className="text-4xl font-black text-white mb-6 leading-tight">
                Questions?<br />We&apos;ve Got Answers.
              </h2>
              <p className="text-white/50 leading-relaxed mb-8">
                Have a question about a programme, pricing, or your specific goals? Send a message and we&apos;ll get back to you within 24 hours.
              </p>
              <div className="flex items-center gap-3 text-white/60">
                <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm">info@homegrown.fit</span>
              </div>
            </div>
            {contactStatus === "sent" ? (
              <div className="flex flex-col items-center justify-center text-center py-12 gap-4">
                <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Message sent!</h3>
                <p className="text-white/50 text-sm">We&apos;ll be in touch within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 bg-zinc-950 border border-white/10 rounded-2xl p-8">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Name</label>
                  <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your name" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
                  <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@email.com" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Message</label>
                  <textarea value={contactMsg} onChange={(e) => setContactMsg(e.target.value)}
                    placeholder="Tell us about your goals or ask a question…" required rows={5}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors text-sm resize-none" />
                </div>
                {contactStatus === "error" && (
                  <p className="text-red-400 text-sm">Could not send message. Please try again.</p>
                )}
                <button type="submit" disabled={contactStatus === "sending"}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-bold py-3.5 rounded-xl transition-colors text-sm">
                  {contactStatus === "sending" ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/10 bg-black py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
                <span className="text-black font-black text-sm">HG</span>
              </div>
              <div>
                <p className="font-bold text-white text-sm">HomeGrown Fitness</p>
                <p className="text-white/40 text-xs">Train With Purpose.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-white/50 justify-center">
              {[
                { label: "Services", href: "#services" },
                { label: "About", href: "#about" },
                { label: "Gallery", href: "#gallery" },
                { label: "Contact", href: "#contact" },
              ].map((l) => (
                <a key={l.href} href={l.href} className="hover:text-amber-400 transition-colors">{l.label}</a>
              ))}
            </div>
            <p className="text-white/30 text-xs text-center">
              © {new Date().getFullYear()} HomeGrown Fitness. All rights reserved.
            </p>
          </div>
        </footer>
      </main>

      {showAuth && (
        <AuthModal mode={authMode} onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />
      )}
      {showBooking && (
        <BookingModal service={selectedService} user={user} onClose={() => { setShowBooking(false); setSelectedService(null); }} />
      )}
      {showPayment && selectedService && (
        <PayModal service={selectedService} user={user} onClose={() => { setShowPayment(false); setSelectedService(null); }} />
      )}
    </>
  );
}


