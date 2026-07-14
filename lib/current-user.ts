import "server-only";

import { auth } from "@/auth";
import { ensureUser } from "@/db/queries";

/**
 * Resolves the signed-in account to a persisted user row, or null when there
 * is no session. Shared by every route handler so authorization lives in one
 * place.
 */
export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  return ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });
}
