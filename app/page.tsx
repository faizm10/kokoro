import { Suspense } from "react";

import { Landing } from "@/components/landing";

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <Landing />
    </Suspense>
  );
}
