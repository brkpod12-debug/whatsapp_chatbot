"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Seal } from "@/components/ui/Seal";
import type { SiteSettings } from "@/sanity/queries";

/** Routes that open on a dark hero, where the header can sit transparent. */
const DARK_HERO = ["/", "/villas", "/apartments", "/farmlands"];

export function Navbar({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const darkHero = DARK_HERO.includes(pathname) || pathname.startsWith("/properties/");
  // On a light page the header has to carry its own background from the first
  // frame, or the paper-coloured wordmark disappears into the paper.
  const solid = scrolled || !darkHero;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
      <div
        className={`mx-auto flex max-w-[1440px] items-center justify-between border px-5 py-3 transition-[background-color,border-color,box-shadow] duration-300 sm:px-6 ${
          solid
            ? "border-line bg-paper/90 shadow-[0_12px_40px_rgba(10,10,9,0.06)] backdrop-blur-xl"
            : "border-paper/15 bg-transparent"
        }`}
      >
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="group flex min-h-11 items-center gap-3 sm:gap-3.5"
        >
          <Image
            src="/logo-mark.png"
            alt=""
            width={360}
            height={349}
            priority
            className="h-8 w-auto transition-transform duration-500 group-hover:scale-[1.04] sm:h-9"
          />
          <span className="flex flex-col leading-none">
            <span
              className={`font-display text-[16px] tracking-[0.16em] transition-colors duration-300 sm:text-[18px] ${
                solid ? "text-ink" : "text-paper"
              }`}
            >
              {settings.name.toUpperCase()}
            </span>{" "}
            <span
              className={`mt-[6px] font-mono text-[8px] uppercase tracking-[0.3em] transition-colors duration-300 sm:text-[9px] ${
                solid ? "text-champagne" : "text-emerald/80"
              }`}
            >
              {settings.city}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {settings.navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`eyebrow group relative inline-flex min-h-11 items-center transition-colors duration-200 hover:text-emerald ${
                solid ? "text-ink/60" : "text-paper/75"
              }`}
            >
              {l.label}
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-emerald transition-transform duration-300 ease-out group-hover:origin-left group-hover:scale-x-100"
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className={`hidden min-h-11 items-center border px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-300 sm:inline-flex ${
              solid
                ? "border-ink/30 text-ink hover:border-emerald hover:bg-emerald/[0.06]"
                : "border-paper/40 text-paper hover:border-paper hover:bg-paper/10"
            }`}
          >
            {settings.enquireLabel}
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex h-11 w-11 items-center justify-center border transition-colors duration-300 lg:hidden ${
              solid
                ? "border-ink/30 text-ink"
                : "border-paper/40 text-paper"
            }`}
          >
            {open ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-carbon/95 backdrop-blur-2xl lg:hidden"
          >
            <nav
              aria-label="Mobile"
              className="flex h-full flex-col justify-between px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-32 sm:px-12"
            >
              <ul className="flex flex-col gap-6">
                {settings.navLinks.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ delay: 0.05 * i + 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="font-display text-[2.5rem] leading-none tracking-[-0.02em] text-paper transition-colors hover:text-emerald sm:text-5xl"
                    >
                      {l.label}
                    </a>
                  </motion.li>
                ))}
                <motion.li
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ delay: 0.28, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href="/contact"
                    onClick={() => setOpen(false)}
                    className="font-display text-[2.5rem] leading-none tracking-[-0.02em] text-emerald sm:text-5xl"
                  >
                    Enquire
                  </Link>
                </motion.li>
              </ul>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ delay: 0.32, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-5 border-t border-paper/15 pt-8"
              >
                <div className="flex items-center gap-3">
                  <Seal className="h-9 w-9 text-paper/80" />
                  <div className="flex flex-col gap-1">
                    <a href={settings.phoneHref} className="stamp text-paper">
                      {settings.phone}
                    </a>
                    <span className="text-[12px] text-paper/60">{settings.hours}</span>
                  </div>
                </div>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
