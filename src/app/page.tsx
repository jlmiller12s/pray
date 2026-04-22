import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import PrayerPlayer from "@/components/PrayerPlayer";

export default async function DailyPrayerView() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const todayStr = new Date().toLocaleDateString("en-CA");

  const prayer = await prisma.prayer.findFirst({
    where: { datePublished: todayStr }
  });

  const isAdmin = (session.user as any).role === "ADMIN";

  // Format today's date nicely, e.g. "Tuesday, April 22"
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", overflow: "hidden" }}>

      {/* Full-screen background image */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage: "url('/prayer_sunset_bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        zIndex: 0,
      }} />

      {/* Dark gradient overlay — heavier at bottom for legibility */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.80) 70%, rgba(0,0,0,0.95) 100%)",
        zIndex: 1,
      }} />

      {/* Content */}
      <div style={{
        position: "relative",
        zIndex: 2,
        maxWidth: "480px",
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "0 24px",
      }}>

        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "56px" }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Daily Prayer
          </span>
          {isAdmin && (
            <Link href="/admin" style={{
              color: "rgba(255,255,255,0.6)",
              textDecoration: "none",
              fontSize: "0.8rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "1px solid rgba(255,255,255,0.25)",
              padding: "6px 14px",
              borderRadius: "20px",
            }}>
              Admin
            </Link>
          )}
        </div>

        {/* Centered content block */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {prayer ? (
            <PrayerPlayer prayer={prayer} dateLabel={dateLabel} />
          ) : (
            <div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {dateLabel}
              </p>
              <h1 className="playfair" style={{ fontSize: "2.8rem", fontWeight: 700, lineHeight: 1.1, color: "#fff", marginBottom: "12px" }}>
                No Prayer<br />Today
              </h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem" }}>
                Check back soon.
              </p>
            </div>
          )}
        </div>

        {/* Footer sign out */}
        <div style={{ paddingBottom: "32px", paddingTop: "24px", textAlign: "center" }}>
          <Link href="/api/auth/signout" style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", textDecoration: "none" }}>
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}
