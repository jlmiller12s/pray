"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  existingAudioPath?: string | null;
  onAudioReady: (file: File | null) => void;
  onRemoveExisting: () => void;
};

export default function AudioRecorder({ existingAudioPath, onAudioReady, onRemoveExisting }: Props) {
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [hasExisting, setHasExisting] = useState(!!existingAudioPath);
  const [micError, setMicError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setHasExisting(!!existingAudioPath);
    setRecordedBlob(null);
    setRecordedUrl(null);
  }, [existingAudioPath]);

  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  const startRecording = async () => {
    setMicError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const file = new File([blob], `prayer_recording.webm`, { type: mimeType });
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setHasExisting(false);
        onAudioReady(file);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // collect chunks every 250ms
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      setMicError("Microphone access was denied. Please allow access in your browser settings.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    onAudioReady(null);
  };

  const removeExisting = () => {
    setHasExisting(false);
    onRemoveExisting();
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ margin: "8px 0" }}>
      <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Audio Prayer (Optional)
      </label>

      {micError && <p style={{ color: "#ff6b6b", fontSize: "0.85rem", marginBottom: "8px" }}>{micError}</p>}

      {/* Show existing saved audio */}
      {hasExisting && existingAudioPath && !recordedUrl && (
        <div className="glass-panel" style={{ padding: "16px", marginBottom: "12px" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--accent-gold)", marginBottom: "8px" }}>📁 Saved Recording</p>
          <audio controls src={existingAudioPath} style={{ width: "100%", marginBottom: "8px" }} />
          <button
            type="button"
            onClick={removeExisting}
            style={{ fontSize: "0.8rem", color: "#ff6b6b", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            ✕ Remove this recording
          </button>
        </div>
      )}

      {/* Show newly recorded audio preview */}
      {recordedUrl && (
        <div className="glass-panel" style={{ padding: "16px", marginBottom: "12px" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--accent-gold)", marginBottom: "8px" }}>🎙 New Recording (preview)</p>
          <audio controls src={recordedUrl} style={{ width: "100%" }} />
          <button
            type="button"
            onClick={discardRecording}
            style={{ fontSize: "0.8rem", color: "#ff6b6b", background: "none", border: "none", cursor: "pointer", padding: "8px 0 0" }}
          >
            ✕ Discard and re-record
          </button>
        </div>
      )}

      {/* Recording controls */}
      {!recordedUrl && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--accent-gold)",
                background: "transparent", color: "var(--accent-gold)", cursor: "pointer",
                fontFamily: "inherit", fontSize: "0.95rem", transition: "all 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,175,55,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              🎙 {hasExisting ? "Re-record" : "Record Prayer"}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 20px", borderRadius: "8px", border: "1px solid #ff6b6b",
                background: "rgba(255,107,107,0.1)", color: "#ff6b6b", cursor: "pointer",
                fontFamily: "inherit", fontSize: "0.95rem", animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              ⏹ Stop Recording
            </button>
          )}

          {recording && (
            <span style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums", fontSize: "0.95rem" }}>
              🔴 {fmt(recordingTime)}
            </span>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.65; }
        }
      `}</style>
    </div>
  );
}
