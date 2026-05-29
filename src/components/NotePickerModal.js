import React, { useState } from "react";
import { modalBackdrop, modalShell, modalCloseButton, modalTitleRow, modalTitle, inputBase } from "../styles";

// Note picker — opens when Lumé's save_note action fires. Drops a note into an
// existing list OR a new one (single-select: tap a list → the note saves there
// → close). Mirrors CollectionPickerModal's styling + list filter/sort +
// create-flow, but writes a collection_blocks note instead of toggling item
// membership. `noteText` is the note to save; null = closed.
export function NotePickerModal({
  noteText, setNoteText,
  collections, itemsByCollection,
  createCollection, addNote,
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (noteText == null) return null;

  const close = () => {
    setNoteText(null);
    setCreating(false);
    setNewName("");
    setError("");
  };

  const countFor = (c) => (itemsByCollection?.[c.id] || []).length;
  // Same visibility/sort as the add-to-list picker: free-form lists only,
  // most-used first (Mark 2026-05-08).
  const visible = (collections || [])
    .filter((c) => !c.isSharedInbox && !c.isSystem && c.type !== "challenge")
    .sort((a, b) => {
      const cb = countFor(b), ca = countFor(a);
      if (cb !== ca) return cb - ca;
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });

  const saveTo = async (collectionId) => {
    setBusy(true);
    setError("");
    const res = await addNote(collectionId, noteText);
    setBusy(false);
    if (res?.error) {
      setError(typeof res.error === "string" ? res.error : "Couldn't save the note.");
      return;
    }
    close();
  };

  const submitNew = async () => {
    const trimmed = (newName || "").trim();
    if (!trimmed) return;
    setBusy(true);
    setError("");
    const created = await createCollection(trimmed);
    if (created?.error) { setBusy(false); setError(created.error); return; }
    const res = await addNote(created.id, noteText);
    setBusy(false);
    if (res?.error) { setError("Couldn't save the note."); return; }
    close();
  };

  return (
    <div onClick={close} style={modalBackdrop}>
      <div onClick={(e) => e.stopPropagation()} style={{
        ...modalShell, maxWidth: 420, maxHeight: "75vh", overflowY: "auto",
      }}>
        <div style={modalTitleRow}>
          <div style={modalTitle}>Save note to a list</div>
          <button onClick={close} aria-label="Close" style={modalCloseButton}>×</button>
        </div>

        {/* The note being saved. */}
        <div style={{
          fontSize: 13, color: "var(--text1)", background: "var(--card-bg)",
          border: "0.5px solid var(--border)", borderRadius: 8, padding: "8px 10px",
          marginBottom: 14, lineHeight: 1.4, maxHeight: 90, overflowY: "auto", whiteSpace: "pre-wrap",
        }}>
          {noteText}
        </div>

        {visible.length === 0 && !creating && (
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12, lineHeight: 1.5 }}>
            No lists yet. Create one to save this note.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {visible.map((c) => {
            const count = countFor(c);
            return (
              <button
                key={c.id}
                onClick={() => saveTo(c.id)}
                disabled={busy}
                title="Save the note to this list"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", borderRadius: 10,
                  border: "0.5px solid var(--border)", background: "var(--card-bg)",
                  color: "var(--text1)", cursor: busy ? "wait" : "pointer",
                  fontFamily: "inherit", fontSize: 14, textAlign: "left", width: "100%",
                }}
              >
                <span style={{ fontWeight: 500 }}>{c.name}</span>
                <span style={{ fontSize: 12, color: "var(--text3)" }}>
                  {`${count} item${count === 1 ? "" : "s"}`}
                </span>
              </button>
            );
          })}
        </div>

        {error && <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 8 }}>{error}</div>}

        {creating ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, borderRadius: 10,
                        border: "0.5px solid var(--border)", background: "var(--card-bg)" }}>
            <input
              autoFocus
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") submitNew(); }}
              placeholder="New list name"
              autoCapitalize="words" autoCorrect="off" spellCheck={false}
              style={{ ...inputBase, fontSize: 14 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setCreating(false); setNewName(""); setError(""); }} style={{
                border: "0.5px solid var(--border)", background: "transparent", color: "var(--text2)",
                padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 13,
              }}>Cancel</button>
              <button onClick={submitNew} disabled={busy || !newName.trim()} style={{
                border: "none", background: "var(--brand-olive)", color: "#fff",
                padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, fontWeight: 500,
                opacity: (!newName.trim() || busy) ? 0.5 : 1,
              }}>Create + save</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setCreating(true)} style={{
            width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: 10,
            border: "0.5px dashed var(--border)", background: "transparent",
            color: "var(--brand)", cursor: "pointer", fontFamily: "inherit", fontSize: 14,
          }}>+ Create new list</button>
        )}
      </div>
    </div>
  );
}
