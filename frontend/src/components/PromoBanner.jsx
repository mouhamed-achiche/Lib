import { useEffect, useState, useCallback } from "react";
import { X, Tag, Clock } from "lucide-react";
import { promosApi } from "@/lib/api";

/** Compute time remaining from now until `endDate` ISO string */
function computeTimeLeft(endDateStr) {
  const diff = new Date(endDateStr) - Date.now();
  if (diff <= 0) return null;

  const totalSecs = Math.floor(diff / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  return { days, hours, minutes, seconds };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function Digit({ value, label }) {
  return (
    <span className="flex flex-col items-center leading-none">
      <span
        className="font-mono text-[15px] font-bold tabular-nums"
        aria-label={`${value} ${label}`}
      >
        {pad(value)}
      </span>
      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest opacity-70">
        {label}
      </span>
    </span>
  );
}

function Colon() {
  return (
    <span className="pb-3 font-mono text-[14px] font-bold opacity-60 select-none">
      :
    </span>
  );
}

export default function PromoBanner() {
  const [promo, setPromo] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  // Fetch active promo
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await promosApi.getActive();
        if (!cancelled && res.data?.promo) {
          setPromo(res.data.promo);
          setTimeLeft(computeTimeLeft(res.data.promo.end_date));
        }
      } catch {
        // Silently fail — no promo banner if API is unavailable
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Tick every second
  useEffect(() => {
    if (!promo?.end_date) return;

    const tick = () => {
      const t = computeTimeLeft(promo.end_date);
      setTimeLeft(t);
      if (!t) setPromo(null); // promo expired
    };

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [promo?.end_date]);

  if (!promo || !timeLeft || dismissed) return null;

  // Build display text
  const discountLabel =
    promo.discount_type === "percentage"
      ? `${promo.discount_value}% OFF`
      : `-${promo.discount_value} DZD`;

  const message =
    promo.announcement_text?.trim() ||
    `${promo.title} — Use code ${promo.code} for ${discountLabel}`;

  return (
    <div
      className="relative z-[60] w-full overflow-hidden"
      role="banner"
      aria-label="Limited-time promotion"
      id="promo-announcement-bar"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-oxford-red via-[#b01c2e] to-academic-blue" />

      {/* Subtle shimmer animation */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 3s infinite linear",
        }}
      />

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>

      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        {/* Left: tag icon + message */}
        <div className="flex min-w-0 flex-1 items-center gap-2 text-white">
          <Tag className="h-4 w-4 shrink-0 opacity-90" aria-hidden="true" />
          <p className="truncate text-[12px] font-semibold tracking-wide sm:text-[13px]">
            {message}
          </p>
        </div>

        {/* Center: countdown clock */}
        <div
          className="flex shrink-0 items-end gap-1 text-white"
          aria-live="polite"
          aria-atomic="true"
          aria-label="Time remaining"
        >
          <Clock className="mb-3 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
          {timeLeft.days > 0 && (
            <>
              <Digit value={timeLeft.days} label="day" />
              <Colon />
            </>
          )}
          <Digit value={timeLeft.hours} label="hr" />
          <Colon />
          <Digit value={timeLeft.minutes} label="min" />
          <Colon />
          <Digit value={timeLeft.seconds} label="sec" />
        </div>

        {/* Dismiss button */}
        <button
          aria-label="Dismiss promotion"
          className="ml-2 shrink-0 rounded-full p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          onClick={() => setDismissed(true)}
          type="button"
          id="promo-banner-dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
