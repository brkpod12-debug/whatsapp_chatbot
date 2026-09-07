"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

const FORM_ID = "contact-concierge";

type FormState = {
  name: string;
  phone: string;
  interest: string;
  budget: string;
  message: string;
};

const defaultInterests = [
  "A villa",
  "An apartment",
  "Farmland",
  "Private advisory",
  "NRI purchase",
  "Other",
];

const defaultBudgets = [
  "Under ₹1 Cr",
  "₹1–3 Cr",
  "₹3–6 Cr",
  "₹6 Cr+",
  "Not sure yet",
];

const initial: FormState = {
  name: "",
  phone: "",
  interest: "",
  budget: "",
  message: "",
};

export function ContactForm({
  whatsapp,
  phone,
  phoneHref,
  interests,
  budgets,
}: {
  whatsapp: string;
  phone: string;
  phoneHref: string;
  interests?: string[];
  budgets?: string[];
}) {
  const interestOptions = interests && interests.length > 0 ? interests : defaultInterests;
  const budgetOptions = budgets && budgets.length > 0 ? budgets : defaultBudgets;
  const [form, setForm] = useState<FormState>(initial);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError(null);
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !/^[+\d][\d\s-]{7,14}$/.test(form.phone.trim())) {
      setError("Please add your name and a phone number the concierge can reach you on.");
      return;
    }
    const text = [
      `New enquiry - joshproperties.co.in`,
      ``,
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Looking for: ${form.interest || "-"}`,
      `Budget: ${form.budget || "-"}`,
      form.message ? `\nNotes:\n${form.message}` : "",
    ].join("\n");
    // window.open bypasses the delegated link listener, so the lead is
    // reported here.
    track("generate_lead", { method: "whatsapp", form: FORM_ID });
    window.open(
      `${whatsapp}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setSent(true);
  }

  // text-base (16px) keeps iOS Safari from auto-zooming into the field.
  const inputClass =
    "w-full bg-transparent py-3 text-base text-ink placeholder:text-ink/60";

  if (sent) {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-14 border border-emerald/40 bg-mist/60 p-10"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald/15 text-emerald">
          <Check size={20} strokeWidth={1.5} />
        </span>
        <h2 className="mt-6 font-display text-3xl text-ink">
          Received.
        </h2>
        <p className="mt-3 max-w-[42ch] text-pretty text-[15px] leading-relaxed text-ink/65">
          We&rsquo;ve opened WhatsApp with your details, hit send there and a
          concierge will reply within two working days. Prefer to talk? Dial{" "}
          <a href={phoneHref} className="text-emerald underline-offset-4 hover:underline">
            {phone}
          </a>
          .
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-14 space-y-10">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        <div className="group-field relative border-b border-ink/20">
          <label htmlFor="name" className="eyebrow text-slate">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            placeholder="How should we address you?"
            value={form.name}
            onChange={set("name")}
            className={inputClass}
          />
          <span className="field-underline" aria-hidden />
        </div>
        <div className="group-field relative border-b border-ink/20">
          <label htmlFor="phone" className="eyebrow text-slate">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+91 ..."
            value={form.phone}
            onChange={set("phone")}
            className={inputClass}
          />
          <span className="field-underline" aria-hidden />
        </div>
      </div>

      <div>
        <p className="eyebrow text-slate">You are looking for</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {interestOptions.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setForm((f) => ({ ...f, interest: i }))}
              className={cn(
                "inline-flex min-h-11 items-center border px-4 py-2 text-[13px] transition-colors",
                form.interest === i
                  ? "border-emerald bg-emerald/10 text-ink"
                  : "border-emerald/30 text-ink/60 hover:border-emerald/60"
              )}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow text-slate">Budget range</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {budgetOptions.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setForm((f) => ({ ...f, budget: b }))}
              className={cn(
                "inline-flex min-h-11 items-center border px-4 py-2 text-[13px] transition-colors",
                form.budget === b
                  ? "border-emerald bg-emerald/10 text-ink"
                  : "border-emerald/30 text-ink/60 hover:border-emerald/60"
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="group-field relative border-b border-ink/20">
        <label htmlFor="message" className="eyebrow text-slate">
          Anything else? (optional)
        </label>
        <textarea
          id="message"
          rows={4}
          placeholder="Location, acres, timeline, NRI status..."
          value={form.message}
          onChange={set("message")}
          className={cn(inputClass, "resize-none")}
        />
        <span className="field-underline" aria-hidden />
      </div>

      {error && (
        <motion.p
          initial={reduce ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[13px] text-red-800"
          role="alert"
        >
          {error}
        </motion.p>
      )}

      <button
        type="submit"
        className="group brass-shimmer inline-flex items-center gap-3 bg-emerald px-9 py-4 text-[12px] font-medium uppercase tracking-[0.12em] text-paper transition-colors duration-300 hover:bg-pine active:scale-[0.98]"
      >
        <Send size={15} strokeWidth={1.5} />
        Enquire privately
      </button>
      <p className="text-[13px] text-ink/60">
        No walk-ins, no pressure, no mailing list.
      </p>
    </form>
  );
}
