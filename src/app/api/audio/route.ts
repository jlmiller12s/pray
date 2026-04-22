import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put, del } from "@vercel/blob";

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

  // Delete old audio file if it is a Blob URL
  if (oldPath && oldPath.startsWith("http")) {
    await del(oldPath).catch(() => {});
  }

  const ext = file.type.includes("mp4") ? "mp4" : "webm";
  const fileName = `prayer_${Date.now()}.${ext}`;

  const blob = await put(`audio/${fileName}`, file, {
    access: 'public',
  });

  return NextResponse.json({ audioPath: blob.url });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { audioPath } = await req.json();
  if (audioPath && audioPath.startsWith("http")) {
    await del(audioPath).catch(() => {});
  }
  return NextResponse.json({ success: true });
}
