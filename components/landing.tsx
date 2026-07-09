"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { GoogleMark } from "@/components/google-mark";

function signInWithGoogle() {
  void signIn("google", { redirectTo: "/dashboard" });
}

export function Landing() {
  const searchParams = useSearchParams();
  const hasError = Boolean(searchParams.get("error"));

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[#d5d2c7]" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[560px]"
      >
        <section className="rounded-[16px] border border-[#dedcd2] bg-card px-7 py-10 sm:px-12 sm:py-14">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 1 }}
            className="font-hand text-[18px] text-olive"
          >
            kokoro
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 max-w-[430px] text-[clamp(2.35rem,7vw,4.1rem)] font-normal leading-[1.06] tracking-[-0.055em]"
          >
            write what you cannot organize.
          </motion.h1>
          <p className="mt-7 max-w-[390px] text-[15px] leading-7 text-stone">
            a quiet journal that turns scattered thoughts into connected threads.
          </p>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="mt-12 flex h-14 w-full items-center justify-center gap-3 rounded-[10px] bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[#152d50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <GoogleMark />
            continue with google
          </button>
          {hasError ? (
            <p role="alert" className="mt-4 text-center text-xs text-error">
              sign in could not be completed. please try again.
            </p>
          ) : null}
        </section>
        <p className="mt-5 flex items-center justify-center gap-2 text-[11px] tracking-[0.08em] text-stone/70">
          thoughts, at their own pace <ArrowDown className="size-3" strokeWidth={1.5} />
        </p>
      </motion.div>
    </main>
  );
}
