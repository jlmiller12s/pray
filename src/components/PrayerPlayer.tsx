"use client";

import { useRef, useState, useEffect } from "react";

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

  return (
    <div style={{ paddingBottom: "48px" }}>

      {/* Date + Title */}
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
        marginBottom: "4px",
        textShadow: "0 2px 20px rgba(0,0,0,0.5)",
      }}>
        {prayer.title}
      </h1>

      {/* Transcript */}
      <div className="playfair" style={{
        color: "rgba(255,255,255,0.9)",
        fontSize: "1.25rem",
        lineHeight: 1.85,
        whiteSpace: "pre-wrap",
        marginBottom: "40px",
        marginTop: "16px",
        textShadow: "0 2px 16px rgba(0,0,0,0.8)",
      }}>
        {prayer.content}
      </div>

      {/* Audio Player */}
      {prayer.audioPath ? (
        <div style={{
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(16px)",
          borderRadius: "20px",
          padding: "20px 24px",
          border: "1px solid rgba(255,255,255,0.1)",
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

      <style>{`
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
