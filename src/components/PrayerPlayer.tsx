"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type Prayer = {
  id: string;
  title: string;
  content: string;
  audioPath: string | null;
  datePublished: string;
};

export default function PrayerPlayer({ prayer, dateLabel }: { prayer: Prayer; dateLabel: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Title animation
    gsap.fromTo('.anim-title', 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.1 }
    );

    // Staggered paragraphs animation
    gsap.fromTo('.anim-p', 
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power3.out',
        delay: 0.4
      }
    );

    // Audio player fade in
    gsap.fromTo('.anim-audio',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.8 }
    );
  }, { scope: containerRef });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrentTime(Number(e.target.value));
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), duration);
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleShare = async () => {
    const shareData = {
      title: prayer.title,
      text: `Read today's prayer: ${prayer.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // AbortError is thrown when user cancels the share, safe to ignore
        if ((err as Error).name !== 'AbortError') {
          console.error("Error sharing:", err);
        }
      }
    } else {
      // Fallback
      try {
        await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <div ref={containerRef} style={{ paddingBottom: "48px" }}>

      {/* Date + Title */}
      <div className="anim-title">
        <p style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: "0.8rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          {dateLabel}
        </p>

        <h1 className="playfair" style={{
          fontSize: "clamp(2.2rem, 8vw, 3.2rem)",
          fontWeight: 700,
          lineHeight: 1.1,
          color: "#fff",
          marginBottom: "16px",
          textShadow: "0 2px 20px rgba(0,0,0,0.5)",
        }}>
          {prayer.title}
        </h1>
      </div>

      {/* Transcript */}
      <div style={{
        background: "rgba(0,0,0,0.15)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: "32px",
        borderRadius: "20px",
        marginBottom: "40px",
        border: "1px solid rgba(255,255,255,0.03)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.4)"
      }}>
        {prayer.content.split('\n').filter(p => p.trim() !== "").map((paragraph, i) => (
        <p key={i} className="anim-p" style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: "clamp(1.5rem, 1vw, 2rem)",
            lineHeight: 1.25,
            marginBottom: "1.5rem",
            textShadow: "0 2px 10px rgba(0,0,0,0.9)",
            opacity: 0,
            fontFamily: "var(--font-poppins), sans-serif",
            fontWeight: 700,
            letterSpacing: "-0.015em",
            wordSpacing: "normal",
          }}>
            {paragraph.split(' ').map((word, wordIndex, arr) => [
              <span key={`w-${wordIndex}`} className="hover-word">{word}</span>,
              wordIndex < arr.length - 1 ? " " : ""
            ])}
          </p>
        ))}
      </div>

      {/* Audio Player */}
      {prayer.audioPath ? (
        <div className="anim-audio" style={{
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(16px)",
          borderRadius: "20px",
          padding: "20px 24px",
          border: "1px solid rgba(255,255,255,0.1)",
          opacity: 0, // start invisible for GSAP
        }}>
          <audio ref={audioRef} src={prayer.audioPath} preload="metadata" />

          {/* Progress bar */}
          <div style={{ position: "relative", marginBottom: "4px" }}>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              step={0.1}
              onChange={seek}
              style={{
                width: "100%",
                appearance: "none",
                height: "3px",
                borderRadius: "2px",
                background: `linear-gradient(to right, #fff ${progress}%, rgba(255,255,255,0.25) ${progress}%)`,
                outline: "none",
                cursor: "pointer",
              }}
            />
          </div>

          {/* Time stamps */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>{fmt(currentTime)}</span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>{fmt(duration)}</span>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "32px" }}>
            {/* Skip back 15s */}
            <button onClick={() => skip(-15)} style={iconBtnStyle} title="Back 15s">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.75" />
                <text x="7.5" y="15.5" fontSize="6" fill="currentColor" stroke="none" fontFamily="sans-serif">15</text>
              </svg>
            </button>

            {/* Play / Pause */}
            <button onClick={togglePlay} style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#fff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              transition: "transform 0.15s ease",
              flexShrink: 0,
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              {playing ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#000">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#000">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>

            {/* Skip forward 15s */}
            <button onClick={() => skip(15)} style={iconBtnStyle} title="Forward 15s">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-.49-3.75" />
                <text x="7.5" y="15.5" fontSize="6" fill="currentColor" stroke="none" fontFamily="sans-serif">15</text>
              </svg>
            </button>
          </div>
        </div>
      ) : (
        /* No audio — just a subtle "text only" indicator */
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "rgba(255,255,255,0.35)",
          fontSize: "0.8rem",
          letterSpacing: "0.06em",
        }}>
          <span>📖</span>
          <span>Text prayer only</span>
        </div>
      )}

      {/* Share Button */}
      <div style={{ marginTop: "32px", display: "flex", justifyContent: "center" }}>
        <button 
          onClick={handleShare}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "100px",
            fontSize: "0.9rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.2)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Share This Prayer
        </button>
      </div>

      <style>{`
        .hover-word {
          display: inline;
          transition: color 0.15s ease, text-shadow 0.15s ease;
        }
        .hover-word:hover {
          color: #fff;
          text-shadow: 0 0 16px rgba(255,200,100,0.9), 0 0 32px rgba(255,180,60,0.5);
          cursor: crosshair;
        }

        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 0 6px rgba(0,0,0,0.4);
        }
        input[type=range]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.75)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px",
  transition: "color 0.2s",
};
