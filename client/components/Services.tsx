"use client";

import { useState } from "react";
import Image from "next/image";
import {
  SERVICES,
  SERVICE_CATEGORIES,
  type Service,
  type ServiceCategory,
} from "@/lib/services";

interface ServicesProps {
  onBook: (service: Service) => void;
  onOpenAuth: (mode: "signin" | "signup") => void;
  isLoggedIn: boolean;
}

export default function Services({ onBook, onOpenAuth, isLoggedIn }: ServicesProps) {
  const [activeTab, setActiveTab] = useState<ServiceCategory>("Workouts");

  const handleBook = (service: Service) => {
    if (!isLoggedIn) {
      onOpenAuth("signup");
      return;
    }
    onBook(service);
  };

  return (
    <section id="services" className="py-24 px-6 bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-3">
            What We Offer
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Our Services
          </h2>
          <p className="mt-4 text-white/60 text-lg max-w-2xl mx-auto">
            Every programme is built around your body, your goals, and your schedule.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === cat
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25"
                  : "border border-white/20 text-white/60 hover:border-white/50 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Service cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES[activeTab].map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onBook={handleBook}
            />
          ))}
        </div>

        {!isLoggedIn && (
          <p className="text-center mt-10 text-white/40 text-sm">
            <button
              onClick={() => onOpenAuth("signup")}
              className="text-amber-400 hover:underline"
            >
              Create a free account
            </button>{" "}
            to book sessions and access member rates.
          </p>
        )}
      </div>
    </section>
  );
}

function ServiceCard({
  service,
  onBook,
}: {
  service: Service;
  onBook: (s: Service) => void;
}) {
  return (
    <div className="flex flex-col bg-black border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-colors group">
      {/* Icon area */}
      <div className="h-32 bg-zinc-900 flex items-center justify-center">
        {service.icon ? (
          <Image
            src={service.icon}
            alt={service.title}
            width={56}
            height={56}
            className="opacity-70 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-bold text-white text-base leading-snug mb-2 group-hover:text-amber-400 transition-colors">
          {service.title}
        </h3>
        <p className="text-white/50 text-sm line-clamp-3 flex-1 leading-relaxed">
          {service.desc}
        </p>

        {/* Meta */}
        <div className="mt-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {service.duration}
          </div>
          <p className="text-amber-400 font-bold text-sm">{service.price}</p>
        </div>

        {/* Actions */}
        <div className="mt-4">
          <button
            onClick={() => onBook(service)}
            className="w-full py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors"
          >
            Book Session
          </button>
        </div>
      </div>
    </div>
  );
}
