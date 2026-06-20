import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentDbUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email =
      clerkUser.emailAddresses.find(
        (address) => address.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) return null;

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      email.split("@")[0];

    return prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email,
        name,
      },
      create: {
        clerkId: userId,
        email,
        name,
      },
    });
  } catch (err) {
    // Temporary server-side logging to help diagnose production render errors.
    // Keep logs minimal to avoid leaking sensitive data.
    // Remove this logging after the issue is resolved.
    const message = err instanceof Error ? err.message : String(err);
    console.error(`getCurrentDbUser error: ${message}`);
    throw err;
  }
}

export async function requireDbUser() {
  const user = await getCurrentDbUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
