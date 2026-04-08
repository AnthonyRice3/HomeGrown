"use client";

import { useState } from "react";
import { SERVICES, SERVICE_CATEGORIES, type Service } from "@/lib/services";

interface BookingUser {
  name: string;
  email: string;
}

interface BookingModalProps {
  /** Pre-selected service (optional, user can change) */
  service: Service | null;
  user: BookingUser | null;
  onClose: () => void;
}

const TIME_SLOTS = [
  "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "9:00 PM",
];

// Flatten all services into one list for the dropdown
const ALL_SERVICES: Service[] = SERVICE_CATEGORIES.flatMap((cat) => SERVICES[cat]);

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function BookingModal({ service: initialService, user, onClose }: BookingModalProps) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [selectedServiceId, setSelectedServiceId] = useState(initialService?.id ?? ALL_SERVICES[0].id);
  const [date, setDate] = useState("");
  const [time, setTime] = useState(TIME_SLOTS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError("Please select a date.");
      return;
    }

    const chosen = ALL_SERVICES.find((s) => s.id === selectedServiceId);
    if (!chosen) return;

    setLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          service: chosen.title,
          date,
          time,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Booking failed. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-zinc-950 border-b border-white/5 z-10">
          <div>
            <h2 className="text-xl font-black text-white">Book a Session</h2>
            <p className="text-white/50 text-xs mt-0.5">Complete the form and we'll confirm shortly.</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="px-8 py-12 text-center">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">You're booked!</h3>
            <p className="text-white/50 text-sm mb-6">
              A confirmation has been sent to <span className="text-amber-400">{email}</span>.
              We'll see you on {date} at {time}.
            </p>
            <button
              onClick={onClose}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3 rounded-full transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors text-sm"
              />
            </div>

            {/* Service selection */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Service</label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors text-sm"
              >
                {SERVICE_CATEGORIES.map((cat) => (
                  <optgroup key={cat} label={cat} className="bg-zinc-900 text-white">
                    {SERVICES[cat].map((s) => (
                      <option key={s.id} value={s.id} className="bg-zinc-900">
                        {s.title} — {s.price}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  min={todayStr()}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors text-sm scheme-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Time</label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors text-sm"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t} className="bg-zinc-900">{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              {loading ? "Booking…" : "Confirm Booking"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
