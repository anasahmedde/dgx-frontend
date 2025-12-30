// src/components/RecentLinks.js - Enhanced with Play, Report, Download buttons
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
  card: { background: "#fff", borderRadius: 16, overflow: "hidden" },
  header: { padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 },
  title: { margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 10 },
  badge: { background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btn: { padding: "8px 14px", borderRadius: 8, border: "none", background: "#f1f5f9", color: "#475569", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, transition: "all 0.2s" },
  btnPrimary: { padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)", transition: "all 0.2s" },
  btnSuccess: { padding: "6px 10px", borderRadius: 6, border: "none", background: "#10b981", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.2s" },
  btnWarning: { padding: "6px 10px", borderRadius: 6, border: "none", background: "#f59e0b", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.2s" },
  btnInfo: { padding: "6px 10px", borderRadius: 6, border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.2s" },
  btnDanger: { padding: "6px 10px", borderRadius: 6, border: "none", background: "#fee2e2", color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.2s" },
  input: { padding: "12px 16px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 14, outline: "none", width: "100%", transition: "border-color 0.2s, box-shadow 0.2s" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  th: { textAlign: "left", padding: "14px 16px", background: "#f8fafc", color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e5e7eb" },
  td: { padding: "16px", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" },
};

/* ======================== Video Player Modal ======================== */
function VideoPlayerModal({ open, onClose, deviceId, videos }) {
  const videoRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoUrls, setVideoUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !deviceId || !videos?.length) {
      setVideoUrls([]); setCurrentIndex(0); setError(null);
      return;
    }
    const fetchUrls = async () => {
      setLoading(true); setError(null);
      try {
        const res = await dvsgApi.get(`/device/${encodeURIComponent(deviceId)}/videos/downloads`);
        if (res.data?.items?.length > 0) {
          setVideoUrls(res.data.items);
        } else {
          setError("No downloadable videos found for this device");
        }
      } catch (e) {
        console.error("Failed to fetch video URLs:", e);
        setError(e?.response?.status === 404 ? "No videos linked to this device or videos have no S3 links" : `Failed to load videos: ${e?.response?.data?.detail || e.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchUrls();
  }, [open, deviceId, videos]);

  useEffect(() => {
    if (!open && videoRef.current) videoRef.current.pause();
  }, [open]);

  const currentVideo = videoUrls[currentIndex];
  const videoRotation = currentVideo?.rotation || 0;
  const nextVideo = () => { if (videoUrls.length > 1) setCurrentIndex((prev) => (prev + 1) % videoUrls.length); };
  const prevVideo = () => { if (videoUrls.length > 1) setCurrentIndex((prev) => (prev - 1 + videoUrls.length) % videoUrls.length); };

  if (!open) return null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(95vw, 900px)", background: "#000", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", background: "#1f2937", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ color: "#fff", fontWeight: 600 }}>🎬 Playing on Device: {deviceId}</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        {currentVideo && (
          <div style={{ padding: "8px 16px", background: "#374151", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ color: "#e5e7eb", fontSize: 14 }}>
              <span style={{ color: "#9ca3af" }}>Video {currentIndex + 1} of {videoUrls.length}:</span>{" "}
              <strong>{currentVideo.video_name || currentVideo.filename || "Unknown"}</strong>
            </div>
            {videoRotation !== 0 && <span style={{ padding: "4px 10px", background: "#4f46e5", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600 }}>Rotation: {videoRotation}°</span>}
          </div>
        )}
        <div style={{ background: "#000", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, position: "relative" }}>
          {loading ? <div style={{ color: "#fff", padding: 40 }}>Loading videos...</div>
          : error ? <div style={{ color: "#fff", padding: 40, textAlign: "center" }}><div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div><div style={{ color: "#ef4444", marginBottom: 8 }}>Video not available</div><div style={{ fontSize: 12, color: "#9ca3af" }}>{error}</div></div>
          : currentVideo?.url ? <video ref={videoRef} src={currentVideo.url} controls autoPlay style={{ maxWidth: "100%", maxHeight: 500, transform: `rotate(${videoRotation}deg)`, transition: "transform 0.3s" }} onEnded={nextVideo} onError={() => setError("Failed to play video. The URL may have expired.")} />
          : <div style={{ color: "#6b7280", padding: 40, textAlign: "center" }}><div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div><div>No video URL available</div></div>}
        </div>
        {videoUrls.length > 1 && (
          <div style={{ padding: "12px 16px", background: "#1f2937", display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <button onClick={prevVideo} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff", cursor: "pointer", fontWeight: 600 }}>◀ Previous</button>
            <div style={{ display: "flex", gap: 6 }}>{videoUrls.map((_, i) => (<div key={i} onClick={() => setCurrentIndex(i)} style={{ width: 10, height: 10, borderRadius: "50%", background: i === currentIndex ? "#4f46e5" : "#4b5563", cursor: "pointer" }} />))}</div>
            <button onClick={nextVideo} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Next ▶</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================== Report Modal ======================== */
function ReportModal({ open, onClose, deviceId }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("24h");

  useEffect(() => {
    if (!open || !deviceId) {
      setData(null); setError(null);
      return;
    }
    loadReport(timeRange);
    // eslint-disable-next-line
  }, [open, deviceId]);

  const loadReport = async (range) => {
    setLoading(true); setError(null); setTimeRange(range);
    try {
      const now = new Date();
      let startTime = new Date();
      switch (range) {
        case "1h": startTime.setHours(now.getHours() - 1); break;
        case "6h": startTime.setHours(now.getHours() - 6); break;
        case "24h": startTime.setDate(now.getDate() - 1); break;
        case "7d": startTime.setDate(now.getDate() - 7); break;
        case "30d": startTime.setDate(now.getDate() - 30); break;
        default: startTime.setDate(now.getDate() - 1);
      }
      const params = {
        start_date: startTime.toISOString().split('T')[0],
        end_date: now.toISOString().split('T')[0],
        limit: 5000,
      };
      const res = await dvsgApi.get(`/device/${encodeURIComponent(deviceId)}/logs`, { params });
      setData(res.data?.items || []);
    } catch (e) {
      console.error("Failed to load report:", e);
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    let url = `${DVSG_BASE}/device/${encodeURIComponent(deviceId)}/logs/download`;
    const now = new Date();
    let startTime = new Date();
    switch (timeRange) {
      case "1h": startTime.setHours(now.getHours() - 1); break;
      case "6h": startTime.setHours(now.getHours() - 6); break;
      case "24h": startTime.setDate(now.getDate() - 1); break;
      case "7d": startTime.setDate(now.getDate() - 7); break;
      case "30d": startTime.setDate(now.getDate() - 30); break;
      default: startTime.setDate(now.getDate() - 1);
    }
    const params = new URLSearchParams({
      start_date: startTime.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    });
    window.open(`${url}?${params.toString()}`, "_blank");
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const temps = data.filter(d => d.log_type === 'temperature' && d.value != null).map(d => parseFloat(d.value));
    const doors = data.filter(d => d.log_type === 'door_open').length;
    if (temps.length === 0) return { temps: [], doors, avg: null, min: null, max: null, current: null };
    return {
      temps,
      doors,
      avg: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
      min: Math.min(...temps).toFixed(1),
      max: Math.max(...temps).toFixed(1),
      current: temps[temps.length - 1].toFixed(1),
    };
  }, [data]);

  if (!open) return null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(95vw, 700px)", background: "#fff", borderRadius: 16, overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 18px", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>📊 Device Report: {deviceId}</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
          {/* Time Range Selector */}
          <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, marginRight: 8 }}>Time Range:</span>
            {[{ v: "1h", l: "1 Hour" }, { v: "6h", l: "6 Hours" }, { v: "24h", l: "24 Hours" }, { v: "7d", l: "7 Days" }, { v: "30d", l: "30 Days" }].map(opt => (
              <button key={opt.v} onClick={() => loadReport(opt.v)} style={{ ...styles.btn, padding: "6px 12px", background: timeRange === opt.v ? "#f59e0b" : "#f1f5f9", color: timeRange === opt.v ? "#fff" : "#475569" }}>{opt.l}</button>
            ))}
            <button onClick={downloadCSV} style={{ ...styles.btnInfo, marginLeft: "auto" }}>📥 Download CSV</button>
          </div>
          
          {loading ? <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading report data...</div>
          : error ? <div style={{ padding: 20, background: "#fef2f2", borderRadius: 8, color: "#dc2626" }}>{error}</div>
          : stats ? (
            <>
              {/* Stats Cards */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                {stats.current && <div style={{ padding: "10px 16px", background: "#dbeafe", borderRadius: 8 }}><div style={{ fontSize: 11, color: "#1e40af" }}>Current</div><div style={{ fontSize: 20, fontWeight: 700, color: "#1e40af" }}>{stats.current}°C</div></div>}
                {stats.avg && <div style={{ padding: "10px 16px", background: "#dcfce7", borderRadius: 8 }}><div style={{ fontSize: 11, color: "#166534" }}>Average</div><div style={{ fontSize: 20, fontWeight: 700, color: "#166534" }}>{stats.avg}°C</div></div>}
                {stats.min && <div style={{ padding: "10px 16px", background: "#fef3c7", borderRadius: 8 }}><div style={{ fontSize: 11, color: "#92400e" }}>Min</div><div style={{ fontSize: 20, fontWeight: 700, color: "#92400e" }}>{stats.min}°C</div></div>}
                {stats.max && <div style={{ padding: "10px 16px", background: "#fee2e2", borderRadius: 8 }}><div style={{ fontSize: 11, color: "#991b1b" }}>Max</div><div style={{ fontSize: 20, fontWeight: 700, color: "#991b1b" }}>{stats.max}°C</div></div>}
                <div style={{ padding: "10px 16px", background: "#f3e8ff", borderRadius: 8 }}><div style={{ fontSize: 11, color: "#7c3aed" }}>Door Opens</div><div style={{ fontSize: 20, fontWeight: 700, color: "#7c3aed" }}>{stats.doors}</div></div>
                <div style={{ padding: "10px 16px", background: "#e0e7ff", borderRadius: 8 }}><div style={{ fontSize: 11, color: "#4338ca" }}>Data Points</div><div style={{ fontSize: 20, fontWeight: 700, color: "#4338ca" }}>{data?.length || 0}</div></div>
              </div>
              
              {/* Log Table */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", maxHeight: 300, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead style={{ position: "sticky", top: 0, background: "#f8fafc" }}>
                    <tr>
                      <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Type</th>
                      <th style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>Value</th>
                      <th style={{ padding: 8, textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data || []).slice(0, 100).map((log, i) => (
                      <tr key={log.id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: 8 }}>
                          <span style={{ display: "inline-block", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: log.log_type === "temperature" ? "#fef3c7" : "#dbeafe", color: log.log_type === "temperature" ? "#92400e" : "#1e40af" }}>{log.log_type}</span>
                        </td>
                        <td style={{ padding: 8, textAlign: "center", fontFamily: "monospace" }}>{log.log_type === "temperature" ? `${log.value}°C` : log.value}</td>
                        <td style={{ padding: 8, textAlign: "right", color: "#6b7280" }}>{new Date(log.logged_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!data || data.length === 0) && <tr><td colSpan={3} style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>No data for selected period</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          ) : <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>No data available</div>}
        </div>
      </div>
    </div>
  );
}

/* ======================== Download Modal ======================== */
function DownloadModal({ open, onClose, deviceId }) {
  const [timeRange, setTimeRange] = useState("24h");

  const downloadCSV = () => {
    const now = new Date();
    let startTime = new Date();
    switch (timeRange) {
      case "1h": startTime.setHours(now.getHours() - 1); break;
      case "6h": startTime.setHours(now.getHours() - 6); break;
      case "24h": startTime.setDate(now.getDate() - 1); break;
      case "7d": startTime.setDate(now.getDate() - 7); break;
      case "30d": startTime.setDate(now.getDate() - 30); break;
      case "all": startTime = new Date(2020, 0, 1); break;
      default: startTime.setDate(now.getDate() - 1);
    }
    const params = new URLSearchParams({
      start_date: startTime.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    });
    window.open(`${DVSG_BASE}/device/${encodeURIComponent(deviceId)}/logs/download?${params.toString()}`, "_blank");
    onClose();
  };

  if (!open) return null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(95vw, 400px)", background: "#fff", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>📥 Download Logs: {deviceId}</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Select Time Range:</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ ...styles.input, cursor: "pointer" }}>
              <option value="1h">Last 1 Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={styles.btn}>Cancel</button>
            <button onClick={downloadCSV} style={{ ...styles.btnInfo, padding: "10px 20px" }}>📥 Download CSV</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ isOnline }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: isOnline === undefined ? "#f1f5f9" : isOnline ? "#ecfdf5" : "#fef2f2", color: isOnline === undefined ? "#64748b" : isOnline ? "#059669" : "#dc2626", fontSize: 12, fontWeight: 600 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline === undefined ? "#9ca3af" : isOnline ? "#10b981" : "#ef4444", boxShadow: isOnline ? "0 0 8px rgba(16, 185, 129, 0.5)" : "none" }} />
      {isOnline === undefined ? "Unknown" : isOnline ? "Online" : "Offline"}
    </span>
  );
}

function MetricsCard({ temperature, daily, monthly }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <span style={{ padding: "4px 10px", borderRadius: 8, background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 600 }}>🌡️ {temperature ?? 0}°C</span>
      <span style={{ padding: "4px 10px", borderRadius: 8, background: "#dbeafe", color: "#1e40af", fontSize: 12, fontWeight: 600 }}>📅 Daily: {daily ?? 0}</span>
      <span style={{ padding: "4px 10px", borderRadius: 8, background: "#f3e8ff", color: "#7c3aed", fontSize: 12, fontWeight: 600 }}>📆 Monthly: {monthly ?? 0}</span>
    </div>
  );
}

function VideoTags({ videos }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {videos.map((v) => (<span key={v} style={{ padding: "5px 10px", borderRadius: 6, background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 500 }}>🎬 {v}</span>))}
    </div>
  );
}

function groupRows(items) {
  const map = new Map();
  for (const it of items || []) {
    const key = `${it.mobile_id}||${it.gname}||${it.shop_name}`;
    if (!map.has(key)) {
      map.set(key, { key, mobile_id: it.mobile_id, gname: it.gname, shop_name: it.shop_name, temperature: it.temperature, daily_count: it.daily_count, monthly_count: it.monthly_count, rotation: it.rotation || 0, originals: [] });
    }
    map.get(key).originals.push({ id: it.id, video_name: it.video_name, rotation: it.rotation || 0 });
  }
  return Array.from(map.values()).map((row) => {
    const videos = row.originals.map((x) => x.video_name);
    const idByVideo = Object.fromEntries(row.originals.map((x) => [x.video_name, x.id]));
    return { ...row, videos, idByVideo };
  });
}

function extractOnlineFlag(res) {
  const payload = res?.data ?? res;
  const candidates = [res?.online, res?.is_online, payload?.online, payload?.is_online, payload?.isOnline, payload?.status, payload];
  for (const v of candidates) {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (typeof v === "string") { const s = v.trim().toLowerCase(); if (s === "true" || s === "1" || s === "online") return true; if (s === "false" || s === "0" || s === "offline") return false; }
  }
  return false;
}

function EditVideosModal({ open, onClose, row, onSaved }) {
  const [allVideoNames, setAllVideoNames] = useState([]);
  const [typed, setTyped] = useState("");
  const [list, setList] = useState(row?.videos || []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    setTyped(""); setList(row?.videos || []); setMsg("");
    (async () => { try { const names = await listVideoNames(); setAllVideoNames(Array.isArray(names) ? names : []); } catch { setAllVideoNames([]); } })();
  }, [open, row]);

  const add = () => {
    const v = (typed || "").trim();
    if (!v) return;
    if (!allVideoNames.includes(v)) { setMsg(`"${v}" is not in the video list.`); return; }
    if (!list.includes(v)) setList([...list, v]);
    setTyped(""); setMsg("");
  };
  const remove = (v) => setList(list.filter((x) => x !== v));
  const save = async () => {
    if (!row || busy) return;
    setBusy(true); setMsg("");
    try {
      const before = new Set(row.videos || []);
      const after = new Set(list || []);
      const toDelete = [...before].filter((v) => !after.has(v));
      const toAdd = [...after].filter((v) => !before.has(v));
      await Promise.all(toDelete.map((v) => { const id = row.idByVideo?.[v]; if (!id) return Promise.resolve(); return deleteLink(id); }));
      await Promise.all(toAdd.map((v) => createLink({ mobile_id: row.mobile_id, gname: row.gname, shop_name: row.shop_name, video_name: v })));
      onSaved?.(); onClose?.();
    } catch (e) { setMsg(e?.response?.data?.detail || e.message || "Failed to save."); } finally { setBusy(false); }
  };

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(95vw, 600px)", maxHeight: "90vh", background: "#fff", borderRadius: 20, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 600 }}>✏️ Edit Videos</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: "none", background: "rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ color: "#475569", fontSize: 14 }}>Device: <b>{row?.mobile_id}</b> — Group: <b>{row?.gname}</b> — Shop: <b>{row?.shop_name}</b></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(list || []).map((v) => (
              <span key={v} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 10, background: "#f1f5f9", color: "#0f172a", fontSize: 13, fontWeight: 600 }}>
                🎬 {v}
                <button onClick={() => remove(v)} style={{ width: 22, height: 22, borderRadius: 8, border: "none", background: "#fee2e2", color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 800 }}>✕</button>
              </span>
            ))}
            {(!list || list.length === 0) && <span style={{ color: "#94a3b8", fontSize: 13 }}>No videos selected.</span>}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input style={styles.input} placeholder="Type video name..." value={typed} onChange={(e) => setTyped(e.target.value)} list="videoNames" />
            <datalist id="videoNames">{allVideoNames.map((v) => (<option key={v} value={v} />))}</datalist>
            <button onClick={add} disabled={!typed} style={styles.btn}>Add</button>
          </div>
          {msg && <div style={{ padding: 12, borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 13 }}>{msg}</div>}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={styles.btn}>Cancel</button>
            <button onClick={save} disabled={busy} style={styles.btnPrimary}>{busy ? "Saving..." : "Save Changes"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecentLinks({ refreshKey }) {
  const [rowsRaw, setRowsRaw] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [loadedAt, setLoadedAt] = useState(null);
  const [editing, setEditing] = useState(null);
  const [playingRow, setPlayingRow] = useState(null);
  const [reportDevice, setReportDevice] = useState(null);
  const [downloadDevice, setDownloadDevice] = useState(null);
  const [fDevice, setFDevice] = useState("");
  const [fGroup, setFGroup] = useState("");
  const [fShop, setFShop] = useState("");
  const [fVideo, setFVideo] = useState("");

  const load = async () => {
    setBusy(true); setMsg("");
    try {
      const res = await listLinks({ limit: 1000, offset: 0 });
      const items = res?.data?.items || res?.items || [];
      setRowsRaw(items);
      setLoadedAt(new Date());
    } catch (e) { setMsg(e?.response?.data?.detail || e.message || "Failed to load."); } finally { setBusy(false); }
  };

  useEffect(() => { load(); }, [refreshKey]);
  useEffect(() => { const id = setInterval(load, 30000); return () => clearInterval(id); }, []);

  const rowsGrouped = useMemo(() => groupRows(rowsRaw), [rowsRaw]);

  useEffect(() => {
    const devices = Array.from(new Set(rowsGrouped.map((r) => r.mobile_id)));
    if (devices.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(devices.map((mobileId) => getDeviceOnlineStatus(mobileId).then((res) => ({ mobileId, is_online: extractOnlineFlag(res) })).catch(() => ({ mobileId, is_online: false }))));
        if (cancelled) return;
        setOnlineStatus((prev) => { const next = { ...prev }; results.forEach(({ mobileId, is_online }) => { next[mobileId] = is_online; }); return next; });
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [rowsGrouped]);

  const rowsFiltered = useMemo(() => {
    const d = (fDevice || "").toLowerCase(), g = (fGroup || "").toLowerCase(), s = (fShop || "").toLowerCase(), v = (fVideo || "").toLowerCase();
    return rowsGrouped.filter((r) => !d || r.mobile_id.toLowerCase().includes(d)).filter((r) => !g || (r.gname || "").toLowerCase().includes(g)).filter((r) => !s || r.shop_name.toLowerCase().includes(s)).filter((r) => !v || r.videos.join(", ").toLowerCase().includes(v));
  }, [rowsGrouped, fDevice, fGroup, fShop, fVideo]);

  const clearFilters = () => { setFDevice(""); setFGroup(""); setFShop(""); setFVideo(""); };

  const deleteGroup = async (row) => {
    if (!row) return;
    const ok = window.confirm(`Delete all ${row.originals.length} link(s) for:\n\nDevice: ${row.mobile_id}\nGroup: ${row.gname}\nShop: ${row.shop_name}?`);
    if (!ok) return;
    try { setBusy(true); await Promise.all(row.originals.map((x) => deleteLink(x.id))); await load(); } catch (e) { setMsg(e?.response?.data?.detail || e.message || "Delete failed."); } finally { setBusy(false); }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <h2 style={styles.title}>📋 Recent Links<span style={styles.badge}>{rowsFiltered.length}</span></h2>
          {loadedAt && <span style={{ fontSize: 12, color: "#94a3b8" }}>Last updated: {loadedAt.toLocaleTimeString()}</span>}
        </div>
        <button onClick={load} disabled={busy} style={styles.btnPrimary}>{busy ? "⏳ Loading..." : "🔄 Reload"}</button>
      </div>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "repeat(4, 1fr) auto", gap: 12 }}>
        <input style={styles.input} placeholder="🔍 Device ID..." value={fDevice} onChange={(e) => setFDevice(e.target.value)} />
        <input style={styles.input} placeholder="👥 Group..." value={fGroup} onChange={(e) => setFGroup(e.target.value)} />
        <input style={styles.input} placeholder="🏪 Shop..." value={fShop} onChange={(e) => setFShop(e.target.value)} />
        <input style={styles.input} placeholder="🎬 Video..." value={fVideo} onChange={(e) => setFVideo(e.target.value)} />
        <button onClick={clearFilters} style={styles.btn}>Clear</button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr><th style={styles.th}>Device</th><th style={styles.th}>Group</th><th style={styles.th}>Shop</th><th style={styles.th}>Videos</th><th style={{ ...styles.th, textAlign: "right" }}>Actions</th></tr>
          </thead>
          <tbody>
            {rowsFiltered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: "center" }}><div style={{ fontSize: 48, marginBottom: 16 }}>📭</div><div style={{ color: "#64748b", fontSize: 16 }}>No links found</div></td></tr>
            ) : (
              rowsFiltered.map((r) => (
                <tr key={r.key} style={{ transition: "background 0.2s" }}>
                  <td style={styles.td}><div style={{ display: "flex", flexDirection: "column", gap: 8 }}><code style={{ fontFamily: "monospace", fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{r.mobile_id}</code><StatusDot isOnline={onlineStatus[r.mobile_id]} /></div></td>
                  <td style={styles.td}><span style={{ padding: "6px 12px", borderRadius: 8, background: "#f0f9ff", color: "#0369a1", fontWeight: 600, fontSize: 13 }}>{r.gname || "—"}</span></td>
                  <td style={styles.td}><span style={{ padding: "6px 12px", borderRadius: 8, background: "#fdf4ff", color: "#a21caf", fontWeight: 600, fontSize: 13 }}>{r.shop_name || "—"}</span></td>
                  <td style={styles.td}><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><VideoTags videos={r.videos} /><MetricsCard temperature={r.temperature} daily={r.daily_count} monthly={r.monthly_count} /></div></td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <button style={styles.btnSuccess} onClick={() => setPlayingRow(r)} disabled={busy || !r.videos?.length} title="Play videos">▶️ Play</button>
                      <button style={styles.btnWarning} onClick={() => setReportDevice(r.mobile_id)} title="View report">📊 Report</button>
                      <button style={styles.btnInfo} onClick={() => setDownloadDevice(r.mobile_id)} title="Download logs">📥 Download</button>
                      <button onClick={() => setEditing(r)} disabled={busy} style={styles.btn}>✏️ Edit</button>
                      <button onClick={() => deleteGroup(r)} disabled={busy} style={styles.btnDanger}>🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {msg && <div style={{ margin: 16, padding: 14, borderRadius: 12, background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", fontSize: 14 }}>⚠️ {msg}</div>}
      <EditVideosModal open={!!editing} row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      <VideoPlayerModal open={!!playingRow} onClose={() => setPlayingRow(null)} deviceId={playingRow?.mobile_id} videos={playingRow?.videos || []} />
      <ReportModal open={!!reportDevice} onClose={() => setReportDevice(null)} deviceId={reportDevice} />
      <DownloadModal open={!!downloadDevice} onClose={() => setDownloadDevice(null)} deviceId={downloadDevice} />
    </div>
  );
}
