"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { GoogleMark } from "@/components/google-mark";
import { TypingAnimation } from "@/components/ui/typing-animation";

function signInWithGoogle() {
  void signIn("google", { redirectTo: "/dashboard" });
}

export function Landing() {
  const searchParams = useSearchParams();
  const hasError = Boolean(searchParams.get("error"));

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,244,237,0.58)_0%,rgba(245,244,237,0.22)_42%,transparent_72%)]"
      />
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex w-full max-w-[640px] flex-col items-center text-center"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 1 }}
          className="font-hand text-[18px] text-[#2f2e2a] [text-shadow:0_1px_18px_rgba(245,244,237,0.9)]"
        >
          kokoro
        </motion.p>
        <TypingAnimation
          as="h1"
          startOnView={false}
          delay={500}
          typeSpeed={58}
          showCursor
          blinkCursor
          cursorStyle="line"
          className="mt-14 max-w-[560px] text-[clamp(2.35rem,7vw,4.1rem)] font-normal leading-[1.06] tracking-[-0.055em] text-[#141413] [text-shadow:0_2px_28px_rgba(245,244,237,0.95)]"
        >
          write what you cannot organize.
        </TypingAnimation>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 max-w-[420px] text-[15px] leading-7 text-[#3d3c37] [text-shadow:0_1px_16px_rgba(245,244,237,0.85)]"
        >
          a quiet journal that turns scattered thoughts into connected threads.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.85, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex w-full max-w-[360px] flex-col items-center"
        >
          <button
            type="button"
            onClick={signInWithGoogle}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-[10px] bg-primary px-5 text-[15px] font-medium text-primary-foreground shadow-[0_10px_30px_rgba(20,20,19,0.18)] transition-colors hover:bg-[#152d50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f4ed]"
          >
            <GoogleMark />
            continue with google
          </button>
          {hasError ? (
            <p role="alert" className="mt-4 text-xs text-error [text-shadow:0_1px_12px_rgba(245,244,237,0.9)]">
              sign in could not be completed. please try again.
            </p>
          ) : null}
          <p className="mt-5 flex items-center justify-center gap-2 text-[11px] tracking-[0.08em] text-[#3f3e39]/80 [text-shadow:0_1px_14px_rgba(245,244,237,0.8)]">
            thoughts, at their own pace <ArrowDown className="size-3" strokeWidth={1.5} />
          </p>
        </motion.div>
      </motion.section>
    </main>
  );
}
