import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("audio") as File | null;
  const oldPath = formData.get("oldPath") as string | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  // Delete old audio file if replacing
  if (oldPath) {
    const oldFullPath = join(process.cwd(), "public", oldPath);
    if (existsSync(oldFullPath)) {
      await unlink(oldFullPath).catch(() => {});
    }
  }

  const ext = file.type.includes("mp4") ? "mp4" : "webm";
  const fileName = `prayer_${Date.now()}.${ext}`;
  const filePath = join(process.cwd(), "public", "audio", fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return NextResponse.json({ audioPath: `/audio/${fileName}` });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { audioPath } = await req.json();
  if (audioPath) {
    const fullPath = join(process.cwd(), "public", audioPath);
    if (existsSync(fullPath)) {
      await unlink(fullPath).catch(() => {});
    }
  }
  return NextResponse.json({ success: true });
}
