"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cacheSignedIn } from "@/lib/auth-cache";

type SettingsPanelProps = {
  account: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

function handleSignOut() {
  cacheSignedIn(false);
  void signOut({ callbackUrl: "/" });
}

export function SettingsPanel({ account }: SettingsPanelProps) {
  return (
    <main className="min-h-screen bg-[rgba(245,244,237,0.82)] px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-[760px]">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-[8px] px-2 py-2 text-sm text-stone transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          back to journal
        </Link>

        <header className="mt-12 border-b border-border pb-8">
          <p className="font-hand text-[17px] text-olive">settings</p>
          <h1 className="mt-3 text-[clamp(2rem,5vw,3.5rem)] font-normal leading-[1.08] tracking-[-0.045em]">
            account and privacy
          </h1>
        </header>

        <div className="mt-8 grid gap-5">
          <Card className="p-6 sm:p-7">
            <CardHeader>
              <CardTitle>account</CardTitle>
              <ShieldCheck className="size-4 text-olive" strokeWidth={1.5} />
            </CardHeader>
            <div className="mt-6 flex items-center gap-4">
              {account.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={account.image}
                  alt={account.name ?? account.email ?? "Signed in account"}
                  className="size-12 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full border border-border bg-background text-sm text-stone">
                  {(account.name ?? account.email ?? "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-[17px] text-foreground">{account.name ?? "Signed in"}</p>
                {account.email ? <p className="truncate text-sm text-stone">{account.email}</p> : null}
              </div>
            </div>
          </Card>

          <Card className="p-6 sm:p-7">
            <CardHeader>
              <CardTitle>session</CardTitle>
            </CardHeader>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="max-w-[44ch] text-sm leading-6 text-stone">
                signing out clears the cached home-page login state on this browser.
              </p>
              <Button type="button" variant="secondary" onClick={handleSignOut}>
                <LogOut className="size-4" strokeWidth={1.5} />
                sign out
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
