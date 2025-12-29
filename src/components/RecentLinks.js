// src/components/RecentLinks.js - Enhanced with Play Video button
import React, { useEffect, useMemo, useState, useRef } from "react";
import { listLinks, deleteLink, createLink, getDeviceOnlineStatus } from "../api/link";
import { listVideoNames } from "../api/video";
import axios from "axios";

// DVSG API for presigned URLs
const DVSG_BASE = process.env.REACT_APP_API_BASE_URL || 
  `${window.location.protocol}//${window.location.hostname}:8005`;

const dvsgApi = axios.create({
  baseURL: DVSG_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

/* ======================== Styles ======================== */
const styles = {
  card: {
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  btn: {
    padding: "10px 18px",
    borderRadius: 10,
    border: "none",
    background: "#f1f5f9",
    color: "#475569",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.2s",
  },
  btnPrimary: {
    padding: "10px 18px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
    transition: "all 0.2s",
  },
  btnSuccess: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "none",
    background: "#10b981",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "all 0.2s",
  },
  btnDanger: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "all 0.2s",
  },
  input: {
    padding: "12px 16px",
    borderRadius: 10,
    border: "2px solid #e5e7eb",
    fontSize: 14,
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "2px solid #e5e7eb",
  },
  td: {
    padding: "16px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
  },
};

/* ======================== Video Player Modal ======================== */
function VideoPlayerModal({ open, onClose, videos, deviceId, rotation }) {
  const videoRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [presignedUrls, setPresignedUrls] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !videos?.length) {
      setPresignedUrls({});
      setCurrentIndex(0);
      return;
    }
    
    // Fetch presigned URLs for all videos
    const fetchUrls = async () => {
      setLoading(true);
      setError(null);
      const urls = {};
      
      for (const videoName of videos) {
        try {
          // Try DVSG presign endpoint
          const res = await dvsgApi.get(`/video/${encodeURIComponent(videoName)}/presign`);
          urls[videoName] = res.data?.url || res.data?.presigned_url;
        } catch (e) {
          console.error(`Failed to get presigned URL for ${videoName}:`, e);
          // Try to get S3 link from video info
          try {
            const infoRes = await dvsgApi.get(`/video/${encodeURIComponent(videoName)}`);
            if (infoRes.data?.s3_link?.startsWith('http')) {
              urls[videoName] = infoRes.data.s3_link;
            }
          } catch (e2) {
            console.error(`Also failed to get video info for ${videoName}:`, e2);
          }
        }
      }
      
      setPresignedUrls(urls);
      setLoading(false);
    };
    
    fetchUrls();
  }, [open, videos]);

  useEffect(() => {
    if (!open && videoRef.current) {
      videoRef.current.pause();
    }
  }, [open]);

  const currentVideo = videos?.[currentIndex];
  const currentUrl = presignedUrls[currentVideo];
  const videoRotation = rotation || 0;

  const nextVideo = () => {
    if (videos?.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }
  };

  const prevVideo = () => {
    if (videos?.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(95vw, 900px)",
          background: "#000",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: "12px 16px", 
          background: "#1f2937",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ color: "#fff", fontWeight: 600 }}>
            🎬 Playing on Device: {deviceId}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {/* Video info */}
        <div style={{ 
          padding: "8px 16px", 
          background: "#374151",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}>
          <div style={{ color: "#e5e7eb", fontSize: 14 }}>
            <span style={{ color: "#9ca3af" }}>Video {currentIndex + 1} of {videos?.length || 0}:</span>{" "}
            <strong>{currentVideo || "None"}</strong>
          </div>
          {videoRotation !== 0 && (
            <span style={{ 
              padding: "4px 10px", 
              background: "#4f46e5", 
              borderRadius: 6, 
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
            }}>
              Rotation: {videoRotation}°
            </span>
          )}
        </div>

        {/* Video Player */}
        <div style={{ 
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          position: "relative",
        }}>
          {loading ? (
            <div style={{ color: "#fff", padding: 40 }}>Loading video...</div>
          ) : error ? (
            <div style={{ color: "#ef4444", padding: 40 }}>{error}</div>
          ) : currentUrl ? (
            <video
              ref={videoRef}
              src={currentUrl}
              controls
              autoPlay
              style={{
                maxWidth: "100%",
                maxHeight: 500,
                transform: `rotate(${videoRotation}deg)`,
                transition: "transform 0.3s",
              }}
              onEnded={nextVideo}
            />
          ) : (
            <div style={{ color: "#6b7280", padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
              <div>Video not available</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>
                The video may not have a presigned URL or the S3 link is not set.
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        {videos?.length > 1 && (
          <div style={{ 
            padding: "12px 16px", 
            background: "#1f2937",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}>
            <button
              onClick={prevVideo}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#4f46e5",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ◀ Previous
            </button>
            <div style={{ 
              display: "flex", 
              gap: 6,
            }}>
              {videos.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: i === currentIndex ? "#4f46e5" : "#4b5563",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
            <button
              onClick={nextVideo}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#4f46e5",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Next ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================== Status Indicator ======================== */
function StatusDot({ isOnline }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 20,
        background: isOnline === undefined ? "#f1f5f9" : isOnline ? "#ecfdf5" : "#fef2f2",
        color: isOnline === undefined ? "#64748b" : isOnline ? "#059669" : "#dc2626",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: isOnline === undefined ? "#9ca3af" : isOnline ? "#10b981" : "#ef4444",
          boxShadow: isOnline ? "0 0 8px rgba(16, 185, 129, 0.5)" : "none",
        }}
      />
      {isOnline === undefined ? "Unknown" : isOnline ? "Online" : "Offline"}
    </span>
  );
}

/* ======================== Metrics Card ======================== */
function MetricsCard({ temperature, daily, monthly }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          padding: "4px 10px",
          borderRadius: 8,
          background: "#fef3c7",
          color: "#92400e",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        🌡️ {temperature ?? 0}°C
      </span>
      <span
        style={{
          padding: "4px 10px",
          borderRadius: 8,
          background: "#dbeafe",
          color: "#1e40af",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        📅 Daily: {daily ?? 0}
      </span>
      <span
        style={{
          padding: "4px 10px",
          borderRadius: 8,
          background: "#f3e8ff",
          color: "#7c3aed",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        📆 Monthly: {monthly ?? 0}
      </span>
    </div>
  );
}

/* ======================== Video Tags ======================== */
function VideoTags({ videos }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {videos.map((v) => (
        <span
          key={v}
          style={{
            padding: "5px 10px",
            borderRadius: 6,
            background: "#f1f5f9",
            color: "#475569",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          🎬 {v}
        </span>
      ))}
    </div>
  );
}

/* ======================== Group Rows Helper ======================== */
function groupRows(items) {
  const map = new Map();
  for (const it of items || []) {
    const key = `${it.mobile_id}||${it.gname}||${it.shop_name}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        mobile_id: it.mobile_id,
        gname: it.gname,
        shop_name: it.shop_name,
        temperature: it.temperature,
        daily_count: it.daily_count,
        monthly_count: it.monthly_count,
        rotation: it.rotation || 0,
        originals: [],
      });
    }
    map.get(key).originals.push({ id: it.id, video_name: it.video_name, rotation: it.rotation || 0 });
  }

  return Array.from(map.values()).map((row) => {
    const videos = row.originals.map((x) => x.video_name);
    const idByVideo = Object.fromEntries(row.originals.map((x) => [x.video_name, x.id]));
    // Use first video's rotation as the main rotation
    const rotation = row.originals[0]?.rotation || 0;
    return { ...row, videos, idByVideo, rotation };
  });
}

/* ======================== Online Status Helper ======================== */
function extractOnlineFlag(res) {
  const payload = res?.data ?? res;

  const candidates = [
    res?.online,
    res?.is_online,
    payload?.online,
    payload?.is_online,
    payload?.isOnline,
    payload?.status,
    payload,
  ];

  for (const v of candidates) {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "true" || s === "1" || s === "online") return true;
      if (s === "false" || s === "0" || s === "offline") return false;
    }
  }

  return false;
}

/* ======================== Edit Modal ======================== */
function EditVideosModal({ open, onClose, row, onSaved }) {
  const [allVideoNames, setAllVideoNames] = useState([]);
  const [typed, setTyped] = useState("");
  const [list, setList] = useState(row?.videos || []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    setTyped("");
    setList(row?.videos || []);
    setMsg("");
    (async () => {
      try {
        const names = await listVideoNames();
        setAllVideoNames(Array.isArray(names) ? names : []);
      } catch {
        setAllVideoNames([]);
      }
    })();
  }, [open, row]);

  const add = () => {
    const v = (typed || "").trim();
    if (!v) return;
    if (!allVideoNames.includes(v)) {
      setMsg(`"${v}" is not in the video list.`);
      return;
    }
    if (!list.includes(v)) setList([...list, v]);
    setTyped("");
    setMsg("");
  };

  const remove = (v) => setList(list.filter((x) => x !== v));

  const save = async () => {
    if (!row || busy) return;
    setBusy(true);
    setMsg("");

    try {
      const before = new Set(row.videos || []);
      const after = new Set(list || []);
      const toDelete = [...before].filter((v) => !after.has(v));
      const toAdd = [...after].filter((v) => !before.has(v));

      await Promise.all(
        toDelete.map((v) => {
          const id = row.idByVideo?.[v];
          if (!id) return Promise.resolve();
          return deleteLink(id);
        })
      );

      await Promise.all(
        toAdd.map((v) =>
          createLink({
            mobile_id: row.mobile_id,
            gname: row.gname,
            shop_name: row.shop_name,
            video_name: v,
          })
        )
      );

      onSaved?.();
      onClose?.();
    } catch (e) {
      setMsg(e?.response?.data?.detail || e.message || "Failed to save.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(95vw, 600px)",
          maxHeight: "90vh",
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 600 }}>
            ✏️ Edit Videos
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: "none",
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ color: "#475569", fontSize: 14 }}>
            Device: <b>{row?.mobile_id}</b> — Group: <b>{row?.gname}</b> — Shop: <b>{row?.shop_name}</b>
          </div>

          {/* Current */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(list || []).map((v) => (
              <span
                key={v}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 10,
                  background: "#f1f5f9",
                  color: "#0f172a",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                🎬 {v}
                <button
                  onClick={() => remove(v)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 8,
                    border: "none",
                    background: "#fee2e2",
                    color: "#dc2626",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
            {(!list || list.length === 0) && (
              <span style={{ color: "#94a3b8", fontSize: 13 }}>No videos selected.</span>
            )}
          </div>

          {/* Add */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              style={styles.input}
              placeholder="Type video name..."
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              list="videoNames"
            />
            <datalist id="videoNames">
              {allVideoNames.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            <button onClick={add} disabled={!typed} style={styles.btn}>
              Add
            </button>
          </div>

          {msg && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: "#fef2f2",
                color: "#dc2626",
                fontSize: 13,
              }}
            >
              {msg}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={styles.btn}>
              Cancel
            </button>
            <button onClick={save} disabled={busy} style={styles.btnPrimary}>
              {busy ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================== Main Component ======================== */
export default function RecentLinks({ refreshKey }) {
  const [rowsRaw, setRowsRaw] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [loadedAt, setLoadedAt] = useState(null);
  const [editing, setEditing] = useState(null);
  const [playingRow, setPlayingRow] = useState(null);

  // Filters
  const [fDevice, setFDevice] = useState("");
  const [fGroup, setFGroup] = useState("");
  const [fShop, setFShop] = useState("");
  const [fVideo, setFVideo] = useState("");

  const load = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await listLinks({ limit: 1000, offset: 0 });
      const items = res?.data?.items || res?.items || [];
      setRowsRaw(items);
      setLoadedAt(new Date());
    } catch (e) {
      setMsg(e?.response?.data?.detail || e.message || "Failed to load.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const rowsGrouped = useMemo(() => groupRows(rowsRaw), [rowsRaw]);

  // Fetch online status
  useEffect(() => {
    const devices = Array.from(new Set(rowsGrouped.map((r) => r.mobile_id)));
    if (devices.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const results = await Promise.all(
          devices.map((mobileId) =>
            getDeviceOnlineStatus(mobileId)
              .then((res) => ({ mobileId, is_online: extractOnlineFlag(res) }))
              .catch(() => ({ mobileId, is_online: false }))
          )
        );

        if (cancelled) return;

        setOnlineStatus((prev) => {
          const next = { ...prev };
          results.forEach(({ mobileId, is_online }) => {
            next[mobileId] = is_online;
          });
          return next;
        });
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [rowsGrouped]);

  const rowsFiltered = useMemo(() => {
    const d = (fDevice || "").toLowerCase();
    const g = (fGroup || "").toLowerCase();
    const s = (fShop || "").toLowerCase();
    const v = (fVideo || "").toLowerCase();

    return rowsGrouped
      .filter((r) => !d || r.mobile_id.toLowerCase().includes(d))
      .filter((r) => !g || (r.gname || "").toLowerCase().includes(g))
      .filter((r) => !s || r.shop_name.toLowerCase().includes(s))
      .filter((r) => !v || r.videos.join(", ").toLowerCase().includes(v));
  }, [rowsGrouped, fDevice, fGroup, fShop, fVideo]);

  const clearFilters = () => {
    setFDevice("");
    setFGroup("");
    setFShop("");
    setFVideo("");
  };

  const deleteGroup = async (row) => {
    if (!row) return;
    const ok = window.confirm(
      `Delete all ${row.originals.length} link(s) for:\n\nDevice: ${row.mobile_id}\nGroup: ${row.gname}\nShop: ${row.shop_name}?`
    );
    if (!ok) return;

    try {
      setBusy(true);
      await Promise.all(row.originals.map((x) => deleteLink(x.id)));
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.detail || e.message || "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <h2 style={styles.title}>
            📋 Recent Links
            <span style={styles.badge}>{rowsFiltered.length}</span>
          </h2>
          {loadedAt && (
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Last updated: {loadedAt.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button onClick={load} disabled={busy} style={styles.btnPrimary}>
          {busy ? "⏳ Loading..." : "🔄 Reload"}
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #f1f5f9",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr) auto",
          gap: 12,
        }}
      >
        <input
          style={styles.input}
          placeholder="🔍 Device ID..."
          value={fDevice}
          onChange={(e) => setFDevice(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="👥 Group..."
          value={fGroup}
          onChange={(e) => setFGroup(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="🏪 Shop..."
          value={fShop}
          onChange={(e) => setFShop(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="🎬 Video..."
          value={fVideo}
          onChange={(e) => setFVideo(e.target.value)}
        />
        <button onClick={clearFilters} style={styles.btn}>
          Clear
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Device</th>
              <th style={styles.th}>Group</th>
              <th style={styles.th}>Shop</th>
              <th style={styles.th}>Videos</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rowsFiltered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                  <div style={{ color: "#64748b", fontSize: 16 }}>No links found</div>
                  <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 8 }}>
                    Create devices and link them to videos
                  </div>
                </td>
              </tr>
            ) : (
              rowsFiltered.map((r) => (
                <tr key={r.key} style={{ transition: "background 0.2s" }}>
                  <td style={styles.td}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <code
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 600,
                          fontSize: 14,
                          color: "#1e293b",
                        }}
                      >
                        {r.mobile_id}
                      </code>
                      <StatusDot isOnline={onlineStatus[r.mobile_id]} />
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "#f0f9ff",
                        color: "#0369a1",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {r.gname || "—"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "#fdf4ff",
                        color: "#a21caf",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {r.shop_name || "—"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <VideoTags videos={r.videos} />
                      <MetricsCard
                        temperature={r.temperature}
                        daily={r.daily_count}
                        monthly={r.monthly_count}
                      />
                    </div>
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <button 
                        onClick={() => setPlayingRow(r)} 
                        disabled={busy || !r.videos?.length}
                        style={{
                          ...styles.btnSuccess,
                          opacity: r.videos?.length ? 1 : 0.5,
                        }}
                        title="Play current videos"
                      >
                        ▶️ Play
                      </button>
                      <button onClick={() => setEditing(r)} disabled={busy} style={styles.btn}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => deleteGroup(r)} disabled={busy} style={styles.btnDanger}>
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Error Message */}
      {msg && (
        <div
          style={{
            margin: 16,
            padding: 14,
            borderRadius: 12,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            color: "#9a3412",
            fontSize: 14,
          }}
        >
          ⚠️ {msg}
        </div>
      )}

      {/* Edit Modal */}
      <EditVideosModal
        open={!!editing}
        row={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />

      {/* Video Player Modal */}
      <VideoPlayerModal
        open={!!playingRow}
        onClose={() => setPlayingRow(null)}
        videos={playingRow?.videos || []}
        deviceId={playingRow?.mobile_id}
        rotation={playingRow?.rotation}
      />
    </div>
  );
}
