import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { PersonWorkspace } from "@/components/person-workspace";
import { ensureUser } from "@/db/queries";
import { getPersonDeep } from "@/db/relationships";
import { serializePersonDetail } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function PersonPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  const { id } = await params;
  const user = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });
  const person = await getPersonDeep(user.id, id);

  if (!person) {
    notFound();
  }

  return <PersonWorkspace initialPerson={serializePersonDetail(person)} />;
}
