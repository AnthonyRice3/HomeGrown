"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SERVICES, SERVICE_CATEGORIES, type Service } from "@/lib/services";
import type { StripeInstance, StripeElements, StripeElement } from "@/types/stripe";

// ─── Props ────────────────────────────────────────────────────────────────────
interface BookingModalProps {
  service: Service | null;
  onClose: () => void;
}

// ─── Constants & helpers ───────────────────────────────────────────────────────────────
const ALL_SERVICES: Service[] = SERVICE_CATEGORIES.flatMap((cat) => SERVICES[cat]);
const stripeKey = process.env.NEXT_PUBLIC_SAGAH_STRIPE_KEY ?? "";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// Convert SAGAH 24h "HH:MM" → "H:MM AM/PM" for display
function formatSlot(hhmm: string): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

interface SlotData {
  available: string[];
  booked: string[];
  blocked: string[];
  isFullDayBlocked: boolean;
}

type Step = "select" | "payment" | "paying";

// ─── Component ────────────────────────────────────────────────────────────────
export default function BookingModal({ service: initialService, onClose }: BookingModalProps) {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const userName = `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim()
    || (clerkUser?.primaryEmailAddress?.emailAddress ?? "");
  const userEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? "";

  const [selectedServiceId, setSelectedServiceId] = useState(
    initialService?.id ?? ALL_SERVICES[0].id
  );
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<SlotData | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [preparingPayment, setPreparingPayment] = useState(false);
  const [conflictError, setConflictError] = useState(false);

  const [step, setStep] = useState<Step>("select");
  const [error, setError] = useState<string | null>(null);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<StripeInstance | null>(null);
  const [stripeElements, setStripeElements] = useState<StripeElements | null>(null);
  const [paymentElement, setPaymentElement] = useState<StripeElement | null>(null);
  const [elementReady, setElementReady] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const stripeInitRef = useRef(false);

  const chosen = ALL_SERVICES.find((s) => s.id === selectedServiceId);

  const fetchSlots = useCallback((d: string) => {
    setSlotsLoading(true);
    setSlots(null);
    fetch(`/api/availability?date=${encodeURIComponent(d)}`)
      .then((r) => r.json())
      .then((data) => { setSlots(data as SlotData); setSlotsLoading(false); })
      .catch(() => { setSlotsLoading(false); });
  }, []);

  // Fetch slots whenever the date changes
  useEffect(() => {
    if (!date) { setSlots(null); setTime(""); return; }
    setTime("");
    setConflictError(false);
    fetchSlots(date);
  }, [date, fetchSlots]);

  async function handleProceedToPayment() {
    if (!userName) { setError("Name missing from your profile. Please update your account settings."); return; }
    if (!userEmail) { setError("Email missing from your profile. Please update your account settings."); return; }
    if (!date) { setError("Please select a date."); return; }
    if (!time) { setError("Please select a time slot."); return; }
    setError(null);
    setPreparingPayment(true);
    try {
      if (!chosen) throw new Error("Service not found.");
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: chosen.cents,
          metadata: {
            service: chosen.title,
            date,
            time,
            name: userName,
            email: userEmail,
          },
        }),
      });
      const checkoutData = await checkoutRes.json() as { clientSecret?: string; error?: string };
      if (!checkoutData.clientSecret) {
        throw new Error(checkoutData.error ?? "Could not set up payment. Please try again.");
      }
      stripeInitRef.current = false;
      setClientSecret(checkoutData.clientSecret);
      setStep("payment");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPreparingPayment(false);
    }
  }

  useEffect(() => {
    if (step !== "payment" || !clientSecret || stripeInitRef.current) return;
    stripeInitRef.current = true;

    if (!stripeKey) {
      setError("Payment is not configured. Please contact us directly.");
      setStep("select");
      return;
    }
    const stripe = window.Stripe?.(stripeKey);
    if (!stripe) {
      setError("Stripe.js failed to load. Please refresh the page.");
      setStep("select");
      return;
    }

    const elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: "night",
        variables: {
          colorPrimary: "#f59e0b",
          colorBackground: "#09090b",
          borderRadius: "12px",
        },
      },
    });

    const pe = elements.create("payment");
    setStripeInstance(stripe);
    setStripeElements(elements);
    setPaymentElement(pe);
  }, [step, clientSecret]);

  // Mount Payment Element into DOM and wait for ready event
  useEffect(() => {
    if (step !== "payment" || !paymentElement || !mountRef.current) return;

    setElementReady(false);
    paymentElement.on("ready", () => setElementReady(true));
    paymentElement.mount("#bm-payment-element");

    return () => {
      try { paymentElement.unmount(); } catch { /* ignore */ }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentElement]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripeInstance || !stripeElements || !chosen || !elementReady) return;

    setStep("paying");
    setError(null);

    const bookingParams = new URLSearchParams({
      service: chosen.title,
      date,
      time,
      name: userName,
      email: userEmail,
    });

    const { error: submitError } = await stripeElements.submit();
    if (submitError) {
      setError(submitError.message ?? "Card validation failed.");
      setStep("payment");
      return;
    }

    const { error: payError } = await stripeInstance.confirmPayment({
      elements: stripeElements,
      confirmParams: {
        return_url: `${window.location.origin}/booking-confirmed?${bookingParams.toString()}`,
      },
      redirect: "if_required",
    });

    if (payError) {
      setError(payError.message ?? "Payment failed. Please try again.");
      setStep("payment");
      return;
    }

    // Create booking — handle 409 if slot was taken between availability fetch and payment
    const bookRes = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: chosen.title,
        date,
        time,
      }),
    });
    const bookData = await bookRes.json().catch(() => ({})) as { conflict?: boolean; error?: string };
    if (!bookRes.ok) {
      if (bookData.conflict) {
        goBackToSelect();
        setConflictError(true);
        fetchSlots(date);
        return;
      }
      setError(bookData.error ?? "Booking failed. Please contact us directly.");
      setStep("payment");
      return;
    }

    router.push(`/booking-confirmed?${bookingParams.toString()}&booked=1`);
    onClose();
  }

  function goBackToSelect() {
    setStep("select");
    setError(null);
    setPreparingPayment(false);
    setClientSecret(null);
    setStripeInstance(null);
    setStripeElements(null);
    setPaymentElement(null);
    setElementReady(false);
    stripeInitRef.current = false;
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== "paying") onClose();
      }}
    >
      <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        <div className="px-8 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-zinc-950 border-b border-white/5 z-10">
          <div>
            <h2 className="text-xl font-black text-white">
              {step === "payment" || step === "paying" ? "Complete Your Booking" : "Book a Session"}
            </h2>
            <p className="text-white/50 text-xs mt-0.5">
              {step === "payment" || step === "paying"
                ? `${chosen?.title} · ${date} · ${formatSlot(time)}`
                : "Select your service, date, and time."}
            </p>
          </div>
          {step !== "paying" && (
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {step === "select" && (
          <div className="px-8 py-6 space-y-5">
            {/* Identity read-only display */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-black text-sm shrink-0">
                {userName.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{userName || "Loading…"}</p>
                <p className="text-white/40 text-xs truncate">{userEmail}</p>
              </div>
            </div>

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

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                min={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors text-sm scheme-dark"
              />
            </div>

            {date && (
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">
                  Available Times
                  {slotsLoading && <span className="ml-2 text-white/30 font-normal">Loading…</span>}
                </label>

                {slotsLoading && (
                  <div className="flex items-center gap-2 text-white/30 text-sm py-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin shrink-0" />
                    Checking trainer&apos;s schedule…
                  </div>
                )}

                {!slotsLoading && slots?.isFullDayBlocked && (
                  <p className="text-white/50 text-sm bg-white/5 rounded-xl px-4 py-3">
                    No sessions available on this date. Please choose another day.
                  </p>
                )}

                {!slotsLoading && slots && !slots.isFullDayBlocked && slots.available.length === 0 && slots.booked.length === 0 && (
                  <p className="text-white/50 text-sm bg-white/5 rounded-xl px-4 py-3">
                    No slots configured for this date. Please choose another day.
                  </p>
                )}

                {!slotsLoading && slots && !slots.isFullDayBlocked && (slots.available.length > 0 || slots.booked.length > 0) && (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.available.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setTime(t); setConflictError(false); }}
                        className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          time === t
                            ? "bg-amber-500 text-black"
                            : "bg-white/5 border border-white/10 text-white hover:border-amber-400 hover:text-amber-400"
                        }`}
                      >
                        {formatSlot(t)}
                      </button>
                    ))}
                    {[...slots.booked, ...slots.blocked].map((t) => (
                      <button
                        key={t}
                        type="button"
                        disabled
                        title="Already booked"
                        className="py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/5 text-white/20 cursor-not-allowed line-through"
                      >
                        {formatSlot(t)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {conflictError && (
              <div className="flex items-start gap-3 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-sm">
                  That slot was just taken. Please select another time.
                </p>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">{error}</p>
            )}

            {chosen && (
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 text-sm">
                <span className="text-white/50">{chosen.duration}</span>
                <span className="text-amber-400 font-bold">{chosen.price}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={!time || !date || slotsLoading || !!slots?.isFullDayBlocked || preparingPayment}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              {preparingPayment ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin inline-block" />
                  Setting up payment…
                </span>
              ) : "Proceed to Payment →"}
            </button>
          </div>
        )}

        {(step === "payment" || step === "paying") && (
          <form onSubmit={handlePay} className="px-8 py-6 space-y-5">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-4 space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Slot available!</span>
              </div>
              <p className="text-white font-semibold text-sm">{chosen?.title}</p>
              <p className="text-white/50 text-xs">{date} · {formatSlot(time)}</p>
              <p className="text-amber-400 font-bold text-sm pt-1">{chosen?.price}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">Payment Details</label>
              <div ref={mountRef} id="bm-payment-element" className="min-h-30" />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={step === "paying" || !elementReady}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              {!elementReady && step !== "paying" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin inline-block" />
                  Loading payment form…
                </span>
              ) : step === "paying" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin inline-block" />
                  Processing payment…
                </span>
              ) : (
                `Pay & Confirm Booking — ${chosen?.price}`
              )}
            </button>

            <button
              type="button"
              onClick={goBackToSelect}
              disabled={step === "paying"}
              className="w-full text-white/40 hover:text-white text-xs transition-colors disabled:opacity-30"
            >
              ← Back to time selection
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
