// src/components/Video.js
import React, { useEffect, useState, useRef } from "react";
import { insertVideo, listVideos, updateVideo, deleteVideo, uploadVideo } from "../api/video";

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
  // list/search
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  // insert (manual link) – keeping for parity with your old UI
  const [videoName, setVideoName] = useState("");
  const [s3Link, setS3Link] = useState("");

  // edit modal
  const [edit, setEdit] = useState(null);

  // --- NEW: upload from browser ---
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [overwrite, setOverwrite] = useState(true);
  const [pct, setPct] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedInfo, setUploadedInfo] = useState(null); // { s3_link, key, bucket }
  const fileInputRef = useRef(null);

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

  // --- Upload handler ---
  const handleUpload = async () => {
    if (!uploadName.trim()) {
      alert("Please enter a video name");
      return;
    }
    if (!uploadFile) {
      alert("Please select a file");
      return;
    }
    setUploadedInfo(null);
    setPct(0);
    setUploading(true);
    try {
      const res = await uploadVideo(
        uploadFile,
        uploadName.trim(),
        overwrite,
        (progressPct) => setPct(progressPct)
      );
      setUploadedInfo(res.data); // contains s3_link, key, bucket, etc.
      // Refresh list to show new/updated row
      load();
      // Clear file input nicely
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // styles
  const input = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 14 };
  const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 };
  const btnPrimary = { ...btn, background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" };
  const btnDanger = { ...btn, background: "#dc2626", color: "#fff", borderColor: "#dc2626" };
  const row = { display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px dashed #eee" };
  const barWrap = { width: "100%", height: 10, background: "#eef2ff", borderRadius: 9999, overflow: "hidden" };
  const bar = { height: "100%", width: `${pct}%`, background: "#4f46e5", transition: "width .2s" };

  const filtered = items.filter((it) => !q || it.video_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <h2 style={{ fontSize: 28, margin: "0 0 12px" }}>Videos</h2>

      {/* ===== NEW: Upload from browser ===== */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>Upload a Video</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
          <input
            style={input}
            placeholder="video_name (saved as video_name.mp4)"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
          />
          <input
            ref={fileInputRef}
            style={input}
            type="file"
            accept="video/mp4,video/*"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
          />
          <button style={btnPrimary} disabled={uploading} onClick={handleUpload}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
            Overwrite if exists
          </label>
          {uploading && (
            <div style={{ flex: 1 }}>
              <div style={barWrap}><div style={bar} /></div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{pct}%</div>
            </div>
          )}
        </div>

        {uploadedInfo && (
          <div style={{ marginTop: 10, fontSize: 14 }}>
            <div><strong>Bucket:</strong> {uploadedInfo.bucket}</div>
            <div style={{ wordBreak: "break-all" }}>
              <strong>Key:</strong> {uploadedInfo.key}
            </div>
            <div style={{ wordBreak: "break-all", color: "#2563eb" }}>
              <strong>S3 URI:</strong> {uploadedInfo.s3_link}
            </div>
          </div>
        )}
      </div>

      {/* ===== Search ===== */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input style={{ ...input, minWidth: 220 }} placeholder="search (q)" value={q} onChange={(e) => setQ(e.target.value)} />
        <button style={btn} onClick={load}>Search</button>
      </div>


      {/* ===== List ===== */}
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

      {/* ===== Edit modal ===== */}
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
              placeholder="e.g. nazmabad_video"
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

