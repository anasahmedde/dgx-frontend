// src/components/Video.js
import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";

// Video API runs on port 8003
const VIDEO_BASE = process.env.REACT_APP_VIDEO_API_URL || 
  `${window.location.protocol}//${window.location.hostname}:8003`;

const videoApi = axios.create({
  baseURL: VIDEO_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: open ? "grid" : "none", placeItems: "center", zIndex: 2000 };
  const card = { width: "min(92vw, 720px)", background: "#fff", borderRadius: 14, boxShadow: "0 20px 50px rgba(0,0,0,.2)", overflow: "hidden" };
  const header = { padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 600 };
  const body = { padding: 16, maxHeight: "70vh", overflowY: "auto" };
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

// Rotation button component
function RotationSelector({ value, onChange }) {
  const rotations = [0, 90, 180, 270];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {rotations.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          style={{
            padding: "4px 8px",
            borderRadius: 4,
            border: value === r ? "2px solid #4f46e5" : "1px solid #e5e7eb",
            background: value === r ? "#eef2ff" : "#fff",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: value === r ? 600 : 400,
          }}
        >
          {r}°
        </button>
      ))}
    </div>
  );
}

// Fit mode selector
function FitModeSelector({ value, onChange }) {
  const modes = [
    { value: "cover", label: "Cover (fill screen)", desc: "Video fills screen, may crop edges" },
    { value: "contain", label: "Contain (show all)", desc: "Shows full video, may have black bars" },
    { value: "fill", label: "Fill (stretch)", desc: "Stretches to fill, may distort" },
    { value: "none", label: "Original size", desc: "No scaling applied" },
  ];
  
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {modes.map((m) => (
        <label
          key={m.value}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: 8,
            borderRadius: 8,
            border: value === m.value ? "2px solid #4f46e5" : "1px solid #e5e7eb",
            background: value === m.value ? "#eef2ff" : "#fff",
            cursor: "pointer",
          }}
        >
          <input
            type="radio"
            name="fitMode"
            value={m.value}
            checked={value === m.value}
            onChange={() => onChange(m.value)}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{m.label}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{m.desc}</div>
          </div>
        </label>
      ))}
    </div>
  );
}

// Content type badge
function ContentTypeBadge({ type }) {
  const colors = {
    video: { bg: "#dbeafe", text: "#1e40af" },
    image: { bg: "#dcfce7", text: "#166534" },
    html: { bg: "#fef3c7", text: "#92400e" },
    pdf: { bg: "#fee2e2", text: "#991b1b" },
  };
  const c = colors[type] || colors.video;
  
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 6px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      background: c.bg,
      color: c.text,
      textTransform: "uppercase",
    }}>
      {type}
    </span>
  );
}

export default function Video() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit modal
  const [edit, setEdit] = useState(null);

  // Upload state
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [overwrite, setOverwrite] = useState(true);
  const [uploadRotation, setUploadRotation] = useState(0);
  const [uploadFitMode, setUploadFitMode] = useState("cover");
  const [uploadDuration, setUploadDuration] = useState(10);
  const [pct, setPct] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedInfo, setUploadedInfo] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await videoApi.get("/videos", { params: { q, limit: 50, offset: 0 } });
      const data = res.data;
      // Handle both array and {items: [...]} response formats
      const items = Array.isArray(data) ? data : data.items || data.data || [];
      setItems(items);
    } catch (e) {
      console.error("Failed to load videos:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const search = q.toLowerCase();
    return items.filter((it) => 
      (it.video_name || "").toLowerCase().includes(search) ||
      (it.content_type || "").toLowerCase().includes(search)
    );
  }, [items, q]);

  const openEdit = (it) => {
    setEdit({
      ...it,
      newName: it.video_name,
      newLink: it.s3_link,
      newRotation: it.rotation || 0,
      newFitMode: it.fit_mode || "cover",
      newDuration: it.display_duration || 10,
    });
  };

  const saveEdit = async () => {
    if (!edit) return;
    
    const patch = {};
    if (edit.newName && edit.newName !== edit.video_name) patch.video_name = edit.newName.trim();
    if (edit.newLink && edit.newLink !== edit.s3_link) patch.s3_link = edit.newLink.trim();
    if (edit.newRotation !== edit.rotation) patch.rotation = edit.newRotation;
    if (edit.newFitMode !== edit.fit_mode) patch.fit_mode = edit.newFitMode;
    if (edit.newDuration !== edit.display_duration) patch.display_duration = edit.newDuration;
    
    if (!Object.keys(patch).length) {
      setEdit(null);
      return;
    }
    
    try {
      await videoApi.put(`/video/${encodeURIComponent(edit.video_name)}`, patch);
      setEdit(null);
      load();
    } catch (e) {
      alert(e?.response?.data?.detail || "Update failed");
    }
  };

  const remove = async (name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await videoApi.delete(`/video/${encodeURIComponent(name)}`);
      load();
    } catch (e) {
      alert(e?.response?.data?.detail || "Delete failed");
    }
  };

  const setRotation = async (videoName, rotation) => {
    try {
      await videoApi.post(`/video/${encodeURIComponent(videoName)}/rotation`, { rotation });
      load();
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to set rotation");
    }
  };

  const setFitMode = async (videoName, fitMode) => {
    try {
      await videoApi.post(`/video/${encodeURIComponent(videoName)}/fit_mode`, { fit_mode: fitMode });
      load();
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to set fit mode");
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      alert("Please select a file");
      return;
    }
    
    const name = uploadName.trim() || uploadFile.name.replace(/\.[^/.]+$/, "");
    
    setUploading(true);
    setPct(0);
    setUploadedInfo(null);
    
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("video_name", name);
      formData.append("overwrite", overwrite ? "true" : "false");
      formData.append("rotation", uploadRotation.toString());
      formData.append("fit_mode", uploadFitMode);
      formData.append("display_duration", uploadDuration.toString());
      
      const res = await videoApi.post("/upload_video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setPct(percent);
          }
        },
      });
      
      setUploadedInfo(res.data);
      setUploadName("");
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      load();
    } catch (e) {
      alert(e?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Styles
  const input = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 14 };
  const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 };
  const btnPrimary = { ...btn, background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" };
  const btnDanger = { ...btn, background: "#dc2626", color: "#fff", borderColor: "#dc2626" };
  const barWrap = { height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" };
  const bar = { height: "100%", background: "#4f46e5", width: `${pct}%`, transition: "width 0.2s" };

  return (
    <div>
      <h2 style={{ fontSize: 28, margin: "0 0 12px" }}>Content Library</h2>
      
      {/* Upload Section */}
      <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 20, border: "1px solid #e5e7eb" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Upload Content</h3>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
          Supports: Video (MP4, WebM, MOV), Images (JPG, PNG, GIF, WebP), HTML, PDF
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Content Name</div>
            <input
              style={{ ...input, width: "100%" }}
              placeholder="e.g. promo_video_summer"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>File</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*,.html,.htm,.pdf"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Rotation</div>
            <RotationSelector value={uploadRotation} onChange={setUploadRotation} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Fit Mode</div>
            <select
              style={{ ...input, width: "100%" }}
              value={uploadFitMode}
              onChange={(e) => setUploadFitMode(e.target.value)}
            >
              <option value="cover">Cover (fill screen)</option>
              <option value="contain">Contain (show all)</option>
              <option value="fill">Fill (stretch)</option>
              <option value="none">Original size</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Duration (for images)</div>
            <input
              style={{ ...input, width: "100%" }}
              type="number"
              min="1"
              max="300"
              value={uploadDuration}
              onChange={(e) => setUploadDuration(parseInt(e.target.value) || 10)}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
            Overwrite if exists
          </label>
          <button style={btnPrimary} disabled={uploading} onClick={handleUpload}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {uploading && (
          <div style={{ marginTop: 10 }}>
            <div style={barWrap}><div style={bar} /></div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{pct}%</div>
          </div>
        )}

        {uploadedInfo && (
          <div style={{ marginTop: 10, padding: 10, background: "#ecfdf5", borderRadius: 8, border: "1px solid #a7f3d0" }}>
            <div style={{ fontWeight: 600, color: "#065f46", marginBottom: 4 }}>✓ Upload successful</div>
            <div style={{ fontSize: 13 }}>
              <ContentTypeBadge type={uploadedInfo.content_type} />
              <span style={{ marginLeft: 8 }}>{uploadedInfo.video_name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input 
          style={{ ...input, minWidth: 220 }} 
          placeholder="Search content..." 
          value={q} 
          onChange={(e) => setQ(e.target.value)} 
        />
        <button style={btn} onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      {/* Content List */}
      <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>Name</th>
              <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee", width: 80 }}>Type</th>
              <th style={{ textAlign: "center", padding: 12, borderBottom: "1px solid #eee", width: 100 }}>Rotation</th>
              <th style={{ textAlign: "center", padding: 12, borderBottom: "1px solid #eee", width: 100 }}>Fit Mode</th>
              <th style={{ textAlign: "right", padding: 12, borderBottom: "1px solid #eee", width: 150 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
                  No content found
                </td>
              </tr>
            )}
            {filtered.map((it) => (
              <tr key={it.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: 12 }}>
                  <div style={{ fontWeight: 600 }}>{it.video_name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>ID: {it.id}</div>
                </td>
                <td style={{ padding: 12 }}>
                  <ContentTypeBadge type={it.content_type || "video"} />
                </td>
                <td style={{ padding: 12, textAlign: "center" }}>
                  <select
                    style={{ ...input, padding: "4px 8px", fontSize: 12 }}
                    value={it.rotation || 0}
                    onChange={(e) => setRotation(it.video_name, parseInt(e.target.value))}
                  >
                    <option value={0}>0°</option>
                    <option value={90}>90°</option>
                    <option value={180}>180°</option>
                    <option value={270}>270°</option>
                  </select>
                </td>
                <td style={{ padding: 12, textAlign: "center" }}>
                  <select
                    style={{ ...input, padding: "4px 8px", fontSize: 12 }}
                    value={it.fit_mode || "cover"}
                    onChange={(e) => setFitMode(it.video_name, e.target.value)}
                  >
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                    <option value="fill">Fill</option>
                    <option value="none">None</option>
                  </select>
                </td>
                <td style={{ padding: 12, textAlign: "right" }}>
                  <button style={{ ...btn, padding: "4px 8px", marginRight: 4 }} onClick={() => openEdit(it)}>
                    Edit
                  </button>
                  <button style={{ ...btnDanger, padding: "4px 8px" }} onClick={() => remove(it.video_name)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!edit}
        title="Edit Content"
        onClose={() => setEdit(null)}
        footer={
          <>
            <button style={btn} onClick={() => setEdit(null)}>Cancel</button>
            <button style={btnPrimary} onClick={saveEdit}>Save Changes</button>
          </>
        }
      >
        {edit && (
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Content Name</label>
              <input
                style={{ ...input, width: "100%" }}
                value={edit.newName}
                onChange={(e) => setEdit((x) => ({ ...x, newName: e.target.value }))}
              />
            </div>
            
            <div>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>S3 Link</label>
              <input
                style={{ ...input, width: "100%" }}
                value={edit.newLink}
                onChange={(e) => setEdit((x) => ({ ...x, newLink: e.target.value }))}
              />
            </div>
            
            <div>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Rotation</label>
              <RotationSelector 
                value={edit.newRotation} 
                onChange={(r) => setEdit((x) => ({ ...x, newRotation: r }))} 
              />
            </div>
            
            <div>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Fit Mode</label>
              <FitModeSelector
                value={edit.newFitMode}
                onChange={(m) => setEdit((x) => ({ ...x, newFitMode: m }))}
              />
            </div>
            
            {edit.content_type !== "video" && (
              <div>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>
                  Display Duration (seconds)
                </label>
                <input
                  type="number"
                  style={{ ...input, width: 100 }}
                  min="1"
                  max="300"
                  value={edit.newDuration}
                  onChange={(e) => setEdit((x) => ({ ...x, newDuration: parseInt(e.target.value) || 10 }))}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
