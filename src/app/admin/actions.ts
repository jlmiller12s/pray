"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { join } from "path";
import { unlink } from "fs/promises";
import { existsSync } from "fs";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createPrayer(data: { title: string; content: string; datePublished: string; audioPath?: string }) {
  await verifyAdmin();
  const prayer = await prisma.prayer.create({
    data: {
      title: data.title,
      content: data.content,
      datePublished: data.datePublished,
      audioPath: data.audioPath ?? null,
    }
  });
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true, prayer };
}

export async function updatePrayer(id: string, data: { title: string; content: string; datePublished: string; audioPath?: string | null }) {
  await verifyAdmin();
  const prayer = await prisma.prayer.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      datePublished: data.datePublished,
      audioPath: data.audioPath ?? null,
    }
  });
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true, prayer };
}

export async function deletePrayer(id: string) {
  await verifyAdmin();
  try {
    // Fetch prayer first to clean up any associated audio file
    const prayer = await prisma.prayer.findUnique({ where: { id } });
    if (prayer?.audioPath) {
      const fullPath = join(process.cwd(), "public", prayer.audioPath);
      if (existsSync(fullPath)) await unlink(fullPath).catch(() => {});
    }
    await prisma.prayer.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("[deletePrayer] error:", err);
    throw err;
  }
}


export async function updateUserRole(targetUserId: string, newRole: "ADMIN" | "USER") {
  const session = await verifyAdmin();

  // Prevent an admin from demoting themselves
  if ((session.user as any).id === targetUserId && newRole === "USER") {
    throw new Error("You cannot remove your own admin privileges.");
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });

  revalidatePath("/admin");
  return { success: true };
}
