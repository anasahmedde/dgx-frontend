import React, { useEffect, useState } from "react";
import { insertVideo, listVideos, updateVideo, deleteVideo } from "../api/video";

function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: open ? "grid" : "none", placeItems: "center", zIndex: 2000 };
  const card = { width: "min(92vw, 640px)", background: "#fff", borderRadius: 14, boxShadow: "0 20px 50px rgba(0,0,0,.2)", overflow: "hidden" };
  const header = { padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 600 };
  const body = { padding: 16 };
  const footerBox = { padding: 16, borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: 8 };
  const closeBtn = { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer" };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <span>{title}</span>
          <button style={closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={body}>{children}</div>
        {footer && <div style={footerBox}>{footer}</div>}
      </div>
    </div>
  );
}

export default function Video() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [videoName, setVideoName] = useState("");
  const [s3Link, setS3Link] = useState("");

  const [edit, setEdit] = useState(null); // { video_name, s3_link, newName, newLink }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    const res = await listVideos({ q, limit: 50, offset: 0 });
    setItems(res.data.items || []);
  };

  const add = async () => {
    if (!videoName.trim() || !s3Link.trim()) return;
    await insertVideo(videoName.trim(), s3Link.trim());
    setVideoName("");
    setS3Link("");
    load();
  };

  const openEdit = (it) => {
    setEdit({ video_name: it.video_name, s3_link: it.s3_link, newName: it.video_name, newLink: it.s3_link });
  };

  const save = async () => {
    if (!edit) return;
    const patch = {};
    if (edit.newName && edit.newName !== edit.video_name) patch.video_name = edit.newName.trim();
    if (edit.newLink && edit.newLink !== edit.s3_link) patch.s3_link = edit.newLink.trim();
    if (!Object.keys(patch).length) return;
    await updateVideo(edit.video_name, patch);
    setEdit(null);
    load();
  };

  const remove = async (name) => {
    if (!window.confirm(`Delete video "${name}"?`)) return;
    await deleteVideo(name);
    load();
  };

  const input = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 14 };
  const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 };
  const btnPrimary = { ...btn, background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" };
  const btnDanger = { ...btn, background: "#dc2626", color: "#fff", borderColor: "#dc2626" };
  const row = { display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px dashed #eee" };

  const filtered = items.filter((it) => !q || it.video_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <h2 style={{ fontSize: 28, margin: "0 0 12px" }}>Videos</h2>

      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input style={{ ...input, minWidth: 220 }} placeholder="search (q)" value={q} onChange={(e) => setQ(e.target.value)} />
        <button style={btn} onClick={load}>Search</button>
      </div>

      {/* Add new */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input style={{ ...input, minWidth: 200 }} placeholder="video_name" value={videoName} onChange={(e) => setVideoName(e.target.value)} />
        <input style={{ ...input, minWidth: 260 }} placeholder="s3_link (s3://bucket/key.mp4)" value={s3Link} onChange={(e) => setS3Link(e.target.value)} />
        <button style={btnPrimary} onClick={add}>Add Video</button>
      </div>

      {/* List */}
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: "4px 12px" }}>
        <div style={{ ...row, fontWeight: 700, borderBottom: "1px solid #eee", paddingTop: 10, paddingBottom: 10 }}>
          <div>Video (ID) — Link</div>
          <div>Update</div>
          <div>Delete</div>
        </div>

        {filtered.map((it) => (
          <div key={it.id} style={row}>
            <div>
              <span style={{ fontWeight: 600 }}>{it.video_name}</span>
              <span style={{ color: "#6b7280", marginLeft: 8 }}>(id: {it.id})</span>
              <div style={{ color: "#2563eb", fontSize: 12, marginTop: 4, wordBreak: "break-all" }}>{it.s3_link}</div>
            </div>
            <div><button style={btn} onClick={() => openEdit(it)}>Update</button></div>
            <div><button style={btnDanger} onClick={() => remove(it.video_name)}>Delete</button></div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      <Modal
        open={!!edit}
        title="Update Video"
        onClose={() => setEdit(null)}
        footer={
          <>
            <button style={btn} onClick={() => setEdit(null)}>Cancel</button>
            <button style={btnPrimary} onClick={save}>Save</button>
          </>
        }
      >
        {edit && (
          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ fontSize: 12, color: "#6b7280" }}>Current name</label>
            <input style={{ ...input }} value={edit.video_name} disabled />

            <label style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>Rename to</label>
            <input
              autoFocus
              style={{ ...input }}
              value={edit.newName}
              onChange={(e) => setEdit((x) => ({ ...x, newName: e.target.value }))}
              placeholder="e.g. summer_sale_01"
            />

            <label style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>New s3_link</label>
            <input
              style={{ ...input }}
              value={edit.newLink}
              onChange={(e) => setEdit((x) => ({ ...x, newLink: e.target.value }))}
              placeholder="s3://bucket/key.mp4"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
