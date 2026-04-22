/**
 * lib/userSync.ts — server-only
 * Syncs an authenticated Clerk user to SAGAH and caches the sagahUserId
 * in Clerk publicMetadata so subsequent syncs skip the SAGAH write.
 */
import { clerkClient } from "@clerk/nextjs/server";
import { sagahRegisterUser } from "@/lib/sagah";

export interface SessionIdentity {
  clerkUserId: string;
  sagahUserId: string;
  email: string;
  name: string;
}

/**
 * Upserts the Clerk user in SAGAH and returns their unified identity.
 * Safe to call on every request — SAGAH's upsert is idempotent and
 * Clerk metadata is only written when the sagahUserId changes.
 */
export async function syncUserToSagah(clerkUserId: string): Promise<SessionIdentity> {
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || email;
  const avatarUrl = clerkUser.imageUrl ?? undefined;

  // Upsert to SAGAH — idempotent via clerkUserId
  const { userId: sagahUserId } = await sagahRegisterUser({
    email,
    name,
    clerkUserId,
    ...(avatarUrl ? { avatarUrl } : {}),
  });

  // Cache sagahUserId in Clerk publicMetadata when it changes
  const cached = clerkUser.publicMetadata?.sagahUserId as string | undefined;
  if (cached !== sagahUserId) {
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { sagahUserId },
    });
  }

  return { clerkUserId, sagahUserId, email, name };
}
