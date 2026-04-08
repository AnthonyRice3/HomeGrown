"use client";

import { useEffect, useRef, useState } from "react";
import type { Service } from "@/lib/services";

// Extend Window to include Stripe.js (loaded via CDN in layout.tsx)
declare global {
  interface Window {
    Stripe?: (key: string) => StripeInstance;
  }
}

interface StripeInstance {
  elements: (options: { clientSecret: string; appearance?: object }) => StripeElements;
  confirmPayment: (options: {
    elements: StripeElements;
    confirmParams: { return_url: string };
    redirect?: "always" | "if_required";
  }) => Promise<{ error?: { message: string } }>;
}

interface StripeElements {
  create: (type: string) => StripeElement;
  submit: () => Promise<{ error?: { message: string } }>;
}

interface StripeElement {
  mount: (selector: string) => void;
  unmount: () => void;
}

interface PayModalProps {
  service: Service;
  user: { name: string; email: string } | null;
  onClose: () => void;
}

const stripeKey = process.env.NEXT_PUBLIC_SAGAH_STRIPE_KEY ?? "";

export default function PayModal({ service, user, onClose }: PayModalProps) {
  const [email, setEmail] = useState(user?.email ?? "");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<StripeInstance | null>(null);
  const [stripeElements, setStripeElements] = useState<StripeElements | null>(null);
  const [paymentElement, setPaymentElement] = useState<StripeElement | null>(null);
  const [status, setStatus] = useState<"idle" | "loading_intent" | "loading_elements" | "ready" | "paying" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  // Step 1 — fetch PaymentIntent as soon as modal opens
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    setStatus("loading_intent");

    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: service.cents }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.clientSecret) throw new Error(data.error ?? "No client secret");
        setClientSecret(data.clientSecret);
        setStatus("loading_elements");
      })
      .catch((err: { message?: string }) => {
        setErrorMsg(err?.message ?? "Could not start payment.");
        setStatus("error");
      });
  }, [service.cents]);

  // Step 2 — init Stripe Elements once clientSecret is ready
  useEffect(() => {
    if (status !== "loading_elements" || !clientSecret) return;
    if (!stripeKey) {
      setErrorMsg("Payment not configured (missing publishable key).");
      setStatus("error");
      return;
    }

    const stripe = window.Stripe?.(stripeKey);
    if (!stripe) {
      setErrorMsg("Stripe.js failed to load. Please refresh.");
      setStatus("error");
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
    // Mount after render
    setStripeInstance(stripe);
    setStripeElements(elements);
    setPaymentElement(pe);
    setStatus("ready");
  }, [status, clientSecret]);

  // Step 3 — mount payment element to DOM
  useEffect(() => {
    if (status === "ready" && paymentElement && mountRef.current) {
      paymentElement.mount("#payment-element");
    }
    return () => {
      if (paymentElement) {
        try { paymentElement.unmount(); } catch { /* ignore */ }
      }
    };
  }, [status, paymentElement]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripeInstance || !stripeElements) return;

    setStatus("paying");
    setErrorMsg(null);

    // First submit the elements form (for validation)
    const { error: submitError } = await stripeElements.submit();
    if (submitError) {
      setErrorMsg(submitError.message ?? "Validation failed.");
      setStatus("ready");
      return;
    }

    const { error } = await stripeInstance.confirmPayment({
      elements: stripeElements,
      confirmParams: {
        return_url: `${window.location.origin}?payment=success`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMsg(error.message ?? "Payment failed.");
      setStatus("ready");
    } else {
      setStatus("success");
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-white/5">
          <div>
            <h2 className="text-xl font-black text-white">Purchase Service</h2>
            <p className="text-amber-400 text-sm mt-0.5 font-semibold">{service.title}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-8 py-6">
          {/* Price summary */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 mb-6">
            <span className="text-white/60 text-sm">{service.duration}</span>
            <span className="text-white font-bold">
              {service.price}
            </span>
          </div>

          {/* Success */}
          {status === "success" && (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Payment successful!</h3>
              <p className="text-white/50 text-sm mb-6">Thank you. A confirmation will be sent to your email.</p>
              <button
                onClick={onClose}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3 rounded-full transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="text-center py-6">
              <p className="text-red-400 bg-red-400/10 rounded-xl px-4 py-3 text-sm mb-4">{errorMsg}</p>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white text-sm"
              >
                Close
              </button>
            </div>
          )}

          {/* Loading */}
          {(status === "loading_intent" || status === "loading_elements") && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-white/40 text-sm">Setting up secure payment…</p>
            </div>
          )}

          {/* Payment form */}
          {(status === "ready" || status === "paying") && (
            <form onSubmit={handlePay} className="space-y-5">
              {!user && (
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Email for receipt</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors text-sm"
                  />
                </div>
              )}

              {/* Stripe Payment Element mount point */}
              <div ref={mountRef} id="payment-element" className="min-h-30" />

              {errorMsg && status === "ready" && (
                <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "paying"}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-bold py-3.5 rounded-xl transition-colors text-sm"
              >
                {status === "paying" ? "Processing…" : `Pay ${service.price}`}
              </button>

              <p className="text-center text-white/30 text-xs">
                Secured by Stripe · Your card details are never stored.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
