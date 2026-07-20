import { Suspense } from "react";

import { auth } from "@/auth";
import { Landing } from "@/components/landing";

export default async function Home() {
  const session = await auth();

  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <Landing initialIsSignedIn={Boolean(session?.user?.email)} />
    </Suspense>
  );
}
