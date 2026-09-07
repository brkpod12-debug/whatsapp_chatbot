"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { useReducedMotion } from "motion/react";
import type { Testimonial } from "@/sanity/queries";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

const BARS = [0.45, 0.8, 0.35, 0.95, 0.6, 1, 0.5, 0.78, 0.55, 0.88, 0.4, 0.7];

function Waveform({ playing }: { playing: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-8 items-center gap-[3px]" aria-hidden>
      {BARS.map((h, i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full transition-colors duration-300",
            playing && !reduce
              ? "animate-wave bg-brass"
              : playing
                ? "bg-brass"
                : "bg-slate/45"
          )}
          style={{
            height: `${h * 100}%`,
            animationDelay: `${i * 0.07}s`,
          }}
        />
      ))}
    </div>
  );
}

function VoiceNote({
  quote,
  name,
  context,
  big,
  delay = 0,
}: {
  quote: string;
  name: string;
  context: string;
  big?: boolean;
  delay?: number;
}) {
  const [playing, setPlaying] = useState(false);
  const reduce = useReducedMotion();

  return (
    <Reveal delay={delay}>
      <figure
        className={cn(
          "flex flex-col gap-6 border border-line bg-paper-dark/70 p-7 sm:p-8",
          big && "lg:flex-row lg:items-start lg:gap-10"
        )}
      >
        <div className="flex items-center gap-6">
          <button
            type="button"
            aria-label={playing ? "Pause note" : "Play note"}
            onClick={() => setPlaying((v) => !v)}
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
              playing
                ? "border-brass bg-brass text-carbon"
                : "border-brass/70 text-brass hover:bg-brass/10"
            )}
          >
            {playing && !reduce ? (
              <Pause size={18} strokeWidth={1.5} />
            ) : (
              <Play size={18} strokeWidth={1.5} className="ml-0.5" />
            )}
          </button>
          <div className="lg:hidden">
            <Waveform playing={playing} />
          </div>
        </div>

        <div className="flex-1">
          <div className={cn("hidden", big ? "lg:block" : "sm:block")}>
            <Waveform playing={playing} />
          </div>
          <blockquote
            className={cn(
              "mt-4 text-balance font-display italic leading-[1.3] text-ink",
              big ? "text-3xl lg:text-[2.4rem]" : "text-xl"
            )}
          >
            {quote}
          </blockquote>
          <figcaption className="mt-5">
            <span className="font-display text-lg text-ink">{name}</span>
            <span className="eyebrow ml-3 text-brass">· {context}</span>
          </figcaption>
        </div>
      </figure>
    </Reveal>
  );
}

export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;

  const featured = items.find((t) => t.featured) ?? items[0];
  const rest = items.filter((t) => t !== featured);

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1440px] px-6 py-28 sm:px-12 lg:px-20 lg:py-40">
        {/* The lead note sits off-centre, so the section does not open on the
            same centred block as the Q&A that follows it. */}
        <div className="max-w-[860px] lg:ml-[6%]">
          <VoiceNote
            quote={featured.quote}
            name={featured.name}
            context={`${featured.project} · ${featured.context}`}
            big
          />
        </div>

        {/* Two staggered columns rather than three equal ones: the offset is
            what keeps this from reading as a row of identical cards, and it
            holds up at any number of notes the register carries. */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-10 lg:mt-20 lg:gap-x-16">
          {rest.map((t, i) => (
            <div key={t.name} className={cn(i % 2 === 1 && "md:mt-16 lg:mt-24")}>
              <VoiceNote
                quote={t.quote}
                name={t.name}
                context={t.context}
                delay={i * 0.08}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
