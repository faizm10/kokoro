import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,244,237,0.62)_0%,rgba(245,244,237,0.34)_44%,rgba(245,244,237,0.08)_74%)]"
      />

      <section className="relative z-10 w-full max-w-[560px] text-center">
        <p className="font-hand text-[18px] text-olive [text-shadow:0_1px_18px_rgba(245,244,237,0.9)]">
          kokoro
        </p>
        <p className="mt-14 text-xs tracking-[0.14em] text-stone [text-shadow:0_1px_14px_rgba(245,244,237,0.8)]">
          404
        </p>
        <h1 className="mt-4 text-[clamp(2.4rem,7vw,4rem)] font-normal leading-[1.06] tracking-[-0.05em] text-foreground [text-shadow:0_2px_28px_rgba(245,244,237,0.95)]">
          this page drifted out of view.
        </h1>
        <p className="mx-auto mt-6 max-w-[380px] text-[15px] leading-7 text-[#3d3c37] [text-shadow:0_1px_16px_rgba(245,244,237,0.85)]">
          the note you followed may have moved, or the address might not exist yet.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_rgba(20,20,19,0.16)] transition-colors hover:bg-[#152d50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f4ed]"
          >
            <BookOpen className="size-4" strokeWidth={1.5} />
            open journal
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-sm text-stone transition-colors hover:bg-secondary/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f4ed]"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            return home
          </Link>
        </div>
      </section>
    </main>
  );
}
