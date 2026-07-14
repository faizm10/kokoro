import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PeopleHub } from "@/components/people-hub";
import { ensureUser } from "@/db/queries";
import { getPeople } from "@/db/relationships";
import { serializePersonSummary } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });
  const people = await getPeople(user.id);

  return (
    <PeopleHub
      initialPeople={people.map(serializePersonSummary)}
      account={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    />
  );
}
