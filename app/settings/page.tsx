import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SettingsPanel } from "@/components/settings-panel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  return (
    <SettingsPanel
      account={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    />
  );
}
