import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentDbUser() {
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
}

export async function requireDbUser() {
  const user = await getCurrentDbUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
