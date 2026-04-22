"use client";

import { useState } from "react";
import { createPrayer, deletePrayer, updatePrayer, updateUserRole } from "./actions";
import AudioRecorder from "./AudioRecorder";

type Prayer = {
  id: string;
  title: string;
  content: string;
  audioPath: string | null;
  datePublished: string;
};

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export default function ClientAdminForm({
  prayers,
  users,
  currentUserId,
}: {
  prayers: Prayer[];
  users: User[];
  currentUserId: string;
}) {
  const emptyForm = { title: "", content: "", datePublished: "", audioPath: null as string | null };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [pendingAudioFile, setPendingAudioFile] = useState<File | null>(null);
  const [removeAudio, setRemoveAudio] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [prayerError, setPrayerError] = useState("");
  const [userLoading, setUserLoading] = useState<string | null>(null);
  const [roleError, setRoleError] = useState("");

  const startEdit = (p: Prayer) => {
    setEditingId(p.id);
    setFormData({ title: p.title, content: p.content, datePublished: p.datePublished, audioPath: p.audioPath });
    setPendingAudioFile(null);
    setRemoveAudio(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setPendingAudioFile(null);
    setRemoveAudio(false);
  };

  /** Upload audio to /api/audio, returns the saved path */
  const uploadAudio = async (file: File, oldPath?: string | null): Promise<string> => {
    const fd = new FormData();
    fd.append("audio", file);
    if (oldPath) fd.append("oldPath", oldPath);
    const res = await fetch("/api/audio", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Audio upload failed");
    const { audioPath } = await res.json();
    return audioPath as string;
  };

  /** Delete audio on the server */
  const deleteAudioFile = async (audioPath: string) => {
    await fetch("/api/audio", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioPath }),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setPrayerError("");
    try {
      let finalAudioPath: string | null = formData.audioPath;

      // Handle audio changes
      if (pendingAudioFile) {
        finalAudioPath = await uploadAudio(pendingAudioFile, formData.audioPath);
      } else if (removeAudio && formData.audioPath) {
        await deleteAudioFile(formData.audioPath);
        finalAudioPath = null;
      }

      if (editingId) {
        await updatePrayer(editingId, { ...formData, audioPath: finalAudioPath });
      } else {
        await createPrayer({ ...formData, audioPath: finalAudioPath ?? undefined });
      }
      cancelEdit();
    } catch (err) {
      console.error(err);
      setPrayerError("Failed to save prayer. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    setPrayerError("");
    try {
      await deletePrayer(id);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
      setPrayerError("Failed to delete prayer. Please try again.");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "ADMIN" | "USER") => {
    setRoleError("");
    setUserLoading(userId);
    try {
      await updateUserRole(userId, newRole);
    } catch (err: any) {
      setRoleError(err.message ?? "Failed to update role.");
    } finally {
      setUserLoading(null);
    }
  };

  return (
    <div style={{ marginTop: "32px", width: "100%" }}>

      {/* ── Prayer Form ── */}
      <div className="glass-panel" style={{ padding: "24px", marginBottom: "32px" }}>
        <h2 className="playfair" style={{ fontSize: "1.5rem", color: "var(--accent-gold)", marginBottom: "16px" }}>
          {editingId ? "Edit Prayer" : "Draft New Prayer"}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            type="text"
            className="input-field"
            placeholder="Title (e.g., Morning Devotion)"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
            style={{ marginBottom: "0" }}
          />
          <input
            type="date"
            className="input-field"
            value={formData.datePublished}
            onChange={e => setFormData({ ...formData, datePublished: e.target.value })}
            required
            style={{ marginBottom: "0" }}
          />
          <textarea
            className="input-field"
            placeholder="Prayer transcript / text..."
            rows={6}
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            required
            style={{ marginBottom: "0", resize: "vertical" }}
          />

          {/* Audio Recorder */}
          <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "16px" }}>
            <AudioRecorder
              existingAudioPath={removeAudio ? null : formData.audioPath}
              onAudioReady={(file) => {
                setPendingAudioFile(file);
                if (file) setRemoveAudio(false);
              }}
              onRemoveExisting={() => {
                setRemoveAudio(true);
                setPendingAudioFile(null);
              }}
            />
          </div>

          {prayerError && (
            <div style={{ color: "#ff6b6b", fontSize: "0.9rem", padding: "10px 0" }}>{prayerError}</div>
          )}
          <div style={{ display: "flex", gap: "16px", paddingTop: "8px" }}>
            <button type="submit" className="btn-primary" disabled={saveLoading}>
              {saveLoading ? "Saving..." : (editingId ? "Update Prayer" : "Publish Prayer")}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={cancelEdit} disabled={saveLoading}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Scheduled Prayers ── */}
      <div style={{ width: "100%", marginBottom: "48px" }}>
        <h2 className="playfair" style={{ fontSize: "1.5rem", marginBottom: "16px", color: "var(--text-primary)" }}>
          Scheduled Prayers
        </h2>
        {prayers.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No prayers published yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {prayers.map((p) => (
              <div key={p.id} className="glass-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>{p.title}</h3>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--accent-gold)" }}>{p.datePublished}</span>
                    {p.audioPath && <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>🎙 Audio</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn-secondary" style={{ padding: "8px 16px", width: "auto" }} onClick={() => startEdit(p)}>Edit</button>
                  {confirmDeleteId === p.id ? (
                    <>
                      <button
                        className="btn-secondary"
                        onClick={() => setConfirmDeleteId(null)}
                        style={{ padding: "8px 16px", width: "auto" }}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-primary"
                        onClick={() => handleDelete(p.id)}
                        disabled={deleteLoading === p.id}
                        style={{ padding: "8px 16px", width: "auto", background: "#ff6b6b", border: "none", color: "#fff" }}
                      >
                        {deleteLoading === p.id ? "..." : "Sure?"}
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-secondary"
                      style={{ padding: "8px 16px", width: "auto", borderColor: "#ff6b6b", color: "#ff6b6b" }}
                      onClick={() => setConfirmDeleteId(p.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── User Management ── */}
      <div style={{ width: "100%" }}>
        <h2 className="playfair" style={{ fontSize: "1.5rem", marginBottom: "8px", color: "var(--text-primary)" }}>
          User Management
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "16px" }}>
          Promote users to Admin so they can manage prayers, or revoke access. You cannot remove your own admin privileges.
        </p>
        {roleError && (
          <div style={{ color: "#ff6b6b", marginBottom: "16px", fontSize: "0.9rem" }}>{roleError}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            const isAdmin = u.role === "ADMIN";
            return (
              <div key={u.id} className="glass-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{u.email}</div>
                  <div style={{ fontSize: "0.8rem", color: isAdmin ? "var(--accent-gold)" : "var(--text-secondary)", marginTop: "4px" }}>
                    {isAdmin ? "⭐ Admin" : "User"} {isSelf ? "(you)" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {isAdmin ? (
                    <button
                      className="btn-secondary"
                      disabled={isSelf || userLoading === u.id}
                      onClick={() => handleRoleChange(u.id, "USER")}
                      title={isSelf ? "You cannot demote yourself" : ""}
                      style={{ padding: "8px 16px", width: "auto", opacity: isSelf ? 0.4 : 1, borderColor: "#ff6b6b", color: "#ff6b6b" }}
                    >
                      {userLoading === u.id ? "Saving..." : "Revoke Admin"}
                    </button>
                  ) : (
                    <button
                      className="btn-secondary"
                      disabled={userLoading === u.id}
                      onClick={() => handleRoleChange(u.id, "ADMIN")}
                      style={{ padding: "8px 16px", width: "auto", borderColor: "var(--accent-gold)", color: "var(--accent-gold)" }}
                    >
                      {userLoading === u.id ? "Saving..." : "Make Admin"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
