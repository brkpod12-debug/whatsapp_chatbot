"use client";

import { useState } from "react";
import type { MasterplanData } from "@/sanity/queries";

const statusStyles: Record<string, { fill: string; stroke: string }> = {
  Available: { fill: "rgba(193,163,109,0.32)", stroke: "#c1a36d" },
  Reserved: { fill: "rgba(132,125,111,0.3)", stroke: "#847d6f" },
  Sold: { fill: "rgba(17,17,15,0.22)", stroke: "#11110f" },
};

export function FarmlandMap({ masterplan }: { masterplan: MasterplanData }) {
  const [active, setActive] = useState<string | null>(null);
  const selected = masterplan.plots.find((p) => p.id === active);

  return (
    <div className="border border-ink/15 bg-stone">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 px-6 py-5">
        <p className="eyebrow text-slate">{masterplan.name}</p>
        <p className="font-mono text-[11px] tracking-[0.1em] text-ink/50">
          Hover or tap the plan to read each holding
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
        <svg
          viewBox="0 0 100 100"
          className="h-auto w-full"
          role="img"
          aria-label="Interactive masterplan of the river plate with individual plots"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect
            x="2"
            y="2"
            width="96"
            height="96"
            fill="rgba(248,245,240,0.7)"
            stroke="rgba(132,125,111,0.5)"
            strokeWidth="0.15"
          />
          <line
            x1="4"
            y1="90"
            x2="96"
            y2="90"
            stroke="rgba(132,125,111,0.4)"
            strokeWidth="0.2"
            strokeDasharray="2 0.7"
          />
          {masterplan.river && (
            <path
              d="M0 88 C 25 72, 40 92, 60 80 S 90 62, 100 68"
              fill="none"
              stroke="rgba(132,125,111,0.6)"
              strokeWidth="1.3"
              strokeDasharray="1 0.8"
            />
          )}
          {masterplan.plots.map((p) => {
            const s = statusStyles[p.status];
            const isActive = active === p.id;
            return (
              <g
                key={p.id}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={`Plot ${p.id}, ${p.size}, phase ${p.phase}, ${p.status}`}
                onClick={() => setActive(isActive ? null : p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive(isActive ? null : p.id);
                  }
                }}
                onMouseEnter={() => setActive(p.id)}
                onMouseLeave={() => setActive(null)}
                className="group cursor-pointer focus-visible:outline-none"
              >
                <rect
                  x={p.x}
                  y={p.y}
                  width="20"
                  height="22"
                  rx="0.4"
                  fill={s.fill}
                  stroke={isActive ? "#191815" : s.stroke}
                  strokeWidth={isActive ? 0.5 : 0.18}
                  style={{ transition: "fill 0.2s ease, stroke 0.2s ease" }}
                  className="group-focus-visible:stroke-[#191815] group-focus-visible:stroke-[0.5]"
                />
                <text
                  x={p.x + 10}
                  y={p.y + 12.5}
                  textAnchor="middle"
                  fontSize="3.2"
                  fill={isActive ? "#191815" : "#847d6f"}
                  fontFamily="var(--font-mono)"
                  className="transition-colors duration-200 group-focus-visible:fill-[#191815]"
                >
                  {p.id}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="border-t border-ink/15 p-6 md:border-l md:border-t-0">
          <p className="eyebrow text-slate">Plot detail</p>
          {selected ? (
            <dl className="mt-4 space-y-3 text-[14px]">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink/50">Plot</dt>
                <dd className="font-display text-3xl text-ink">
                  {selected.id}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/50">Size</dt>
                <dd className="text-ink">{selected.size}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/50">Phase</dt>
                <dd className="text-ink">{selected.phase === 1 ? "Phase 1" : "Phase 2"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/50">Status</dt>
                <dd className="text-ink">{selected.status}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-[14px] leading-relaxed text-ink/60">
              Hover or tap the plan to read each holding. Available plots are
              marked in emerald.
            </p>
          )}

          <div className="mt-6 space-y-2.5 border-t border-ink/10 pt-5">
            {Object.keys(statusStyles).map((s) => (
              <div key={s} className="flex items-center gap-3">
                <span
                  className="h-2.5 w-4 border"
                  style={{
                    backgroundColor: statusStyles[s].fill,
                    borderColor: statusStyles[s].stroke,
                  }}
                />
                <span className="text-[12px] uppercase tracking-[0.14em] text-ink/60">
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
