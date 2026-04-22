import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import ClientAdminForm from "./ClientForm";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  const [prayers, users] = await Promise.all([
    prisma.prayer.findMany({
      orderBy: { datePublished: "desc" },
      select: { id: true, title: true, content: true, audioPath: true, datePublished: true },
    }),
    prisma.user.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, email: true, name: true, role: true } }),
  ]);

  return (
    <div className="container fade-in">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
        <h1 className="playfair" style={{ fontSize: "2rem", color: "var(--accent-gold)" }}>
          Prayer CMS
        </h1>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link href="/" className="btn-secondary" style={{ padding: "8px 16px", textDecoration: "none", width: "auto" }}>
            View Site
          </Link>
          <span style={{ color: "var(--text-secondary)" }}>
            {session.user.email}
          </span>
        </div>
      </header>

      <ClientAdminForm
        prayers={prayers}
        users={users}
        currentUserId={(session.user as any).id}
      />
    </div>
  );
}
