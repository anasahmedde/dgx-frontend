// src/components/RecentLinks.js
import React, { useEffect, useMemo, useState } from "react";
import { listLinks, deleteLink, createLink, getDeviceOnlineStatus } from "../api/link";
import { listVideoNames } from "../api/video";

/* ---------- Small helpers ---------- */
const btn = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
};
const btnPrimary = { ...btn, background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" };
const btnDanger = { ...btn, background: "#ef4444", color: "#fff", borderColor: "#ef4444" };

/* Status dot: grey = unknown, green = online, red = offline */
const statusDot = (status) => {
  const color =
    status === undefined ? "#9ca3af" : status ? "#10b981" : "#ef4444"; // grey / green / red

  return {
    display: "inline-block",
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: color,
    marginRight: 6,
    verticalAlign: "middle",
    pointerEvents: "none",
  };
};

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
        // take metrics from the first row for this device/group/shop
        temperature: it.temperature,
        daily_count: it.daily_count,
        monthly_count: it.monthly_count,
        originals: [],
      });
    }
    map.get(key).originals.push({ id: it.id, video_name: it.video_name });
  }

  return Array.from(map.values()).map((row) => {
    const videos = row.originals.map((x) => x.video_name);
    const idByVideo = Object.fromEntries(row.originals.map((x) => [x.video_name, x.id]));
    return { ...row, videos, idByVideo };
  });
}

/* ---------- Edit modal for videos ---------- */
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
        setAllVideoNames(names || []);
      } catch {
        setAllVideoNames([]);
      }
    })();
  }, [open, row]);

  const chip = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    fontSize: 13,
    lineHeight: 1,
    whiteSpace: "nowrap",
  };
  const inputBox = {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 8,
    minHeight: 44,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  };

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
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(92vw, 720px)",
          maxHeight: "80vh",
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 20px 50px rgba(0,0,0,.2)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: 12,
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <strong>Edit videos</strong>
          <button style={btn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ padding: 16, display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#475569" }}>
            <div>
              <b>Device:</b> {row?.mobile_id}
            </div>
            <div>
              <b>Group:</b> {row?.gname}
            </div>
            <div>
              <b>Shop:</b> {row?.shop_name}
            </div>
          </div>

          <label style={{ fontSize: 13, fontWeight: 600 }}>Videos</label>
          <div style={inputBox}>
            {list.map((v) => (
              <span key={v} style={chip}>
                {v}
                <button
                  type="button"
                  onClick={() => remove(v)}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              list="all-video-names"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              placeholder="Type a video and press Enter"
              style={{ border: "none", outline: "none", flex: 1, minWidth: 160 }}
            />
            <datalist id="all-video-names">
              {allVideoNames.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={btn} onClick={add} disabled={!typed}>
              Add
            </button>
            <button style={btnPrimary} onClick={save} disabled={busy}>
              Save
            </button>
          </div>

          {msg && (
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 10,
                color: msg.startsWith("Failed") ? "#dc2626" : "#111827",
              }}
            >
              {busy ? "Working…" : msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Main table ---------- */
export default function RecentLinks({ refreshKey }) {
  const [rowsRaw, setRowsRaw] = useState([]);
  const [loadedAt, setLoadedAt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [fDevice, setFDevice] = useState("");
  const [fGroup, setFGroup] = useState("");
  const [fShop, setFShop] = useState("");
  const [fVideo, setFVideo] = useState("");

  const [editing, setEditing] = useState(null);

  // mobile_id -> true/false
  const [onlineStatus, setOnlineStatus] = useState({});

  const load = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await listLinks({ limit: 1000, offset: 0 });
      setRowsRaw(r.data?.items || []);
      setLoadedAt(new Date());
    } catch (e) {
      setMsg(e?.response?.data?.detail || e.message || "Failed to load.");
    } finally {
      setBusy(false);
    }
  };

  // Manual refresh from parent via refreshKey
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(() => {
      load();
    }, 30000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rowsGrouped = useMemo(() => groupRows(rowsRaw), [rowsRaw]);

  // Fetch online status for each unique device whenever rows change
  useEffect(() => {
    const devices = Array.from(new Set(rowsGrouped.map((r) => r.mobile_id)));
    if (devices.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const results = await Promise.all(
          devices.map((mobileId) =>
            getDeviceOnlineStatus(mobileId)
              .then((res) => ({
                mobileId,
                is_online: !!res.data?.is_online,
              }))
              .catch(() => ({
                mobileId,
                is_online: false,
              }))
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
      } catch {
        // ignore
      }
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
      .filter((r) => (!d || r.mobile_id.toLowerCase().includes(d)))
      .filter((r) => (!g || (r.gname || "").toLowerCase().includes(g)))
      .filter((r) => (!s || r.shop_name.toLowerCase().includes(s)))
      .filter((r) => (!v || r.videos.join(", ").toLowerCase().includes(v)));
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

  const input = {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 14,
    width: "100%",
    outline: "none",
  };

  return (
    <div style={{ background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Recent Links</h2>
        <button style={btn} onClick={load} disabled={busy}>
          {busy ? "Loading…" : "Reload"}
        </button>
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {loadedAt ? `Last loaded: ${loadedAt.toLocaleTimeString()}` : ""}
        </span>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <input
          style={input}
          placeholder="Device (mobile_id)"
          value={fDevice}
          onChange={(e) => setFDevice(e.target.value)}
        />
        <input
          style={input}
          placeholder="Group (gname)"
          value={fGroup}
          onChange={(e) => setFGroup(e.target.value)}
        />
        <input
          style={input}
          placeholder="Shop (shop_name)"
          value={fShop}
          onChange={(e) => setFShop(e.target.value)}
        />
        <input
          style={input}
          placeholder="Video (video_name)"
          value={fVideo}
          onChange={(e) => setFVideo(e.target.value)}
        />
        <button style={btn} onClick={clearFilters}>
          Clear
        </button>
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ textAlign: "left", padding: 10 }}>Device</th>
              <th style={{ textAlign: "left", padding: 10 }}>Group</th>
              <th style={{ textAlign: "left", padding: 10 }}>Shop</th>
              <th style={{ textAlign: "left", padding: 10 }}>Video</th>
              <th style={{ textAlign: "right", padding: 10, width: 260 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rowsFiltered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 14, color: "#6b7280" }}>
                  No rows.
                </td>
              </tr>
            )}
            {rowsFiltered.map((r) => {
              const isOnline = onlineStatus[r.mobile_id];
              const metricsText = `Temperature: ${r.temperature ?? 0}°C   |   Daily: ${
                r.daily_count ?? 0
              }   |   Monthly: ${r.monthly_count ?? 0}`;
              return (
                <tr key={r.key} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 10, fontFamily: "monospace" }}>{r.mobile_id}</td>
                  <td style={{ padding: 10 }}>{r.gname}</td>
                  <td style={{ padding: 10 }}>{r.shop_name}</td>
                  <td style={{ padding: 10 }}>{r.videos.join(", ")}</td>
                  <td style={{ padding: 10, textAlign: "right", whiteSpace: "nowrap" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 6,
                      }}
                    >
                      {/* Status dot + metrics */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={statusDot(isOnline)} aria-hidden="true" />
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#111827",
                            fontFamily:
                              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          }}
                        >
                          {metricsText}
                        </span>
                      </div>

                      {/* Buttons */}
                      <div>
                        <button
                          style={btn}
                          onClick={() => setEditing(r)}
                          disabled={busy}
                        >
                          Edit
                        </button>{" "}
                        <button
                          style={btnDanger}
                          onClick={() => deleteGroup(r)}
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {msg && (
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            lineHeight: 1.5,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            color: "#9a3412",
            borderRadius: 8,
            padding: 10,
          }}
        >
          {msg}
        </div>
      )}

      <EditVideosModal
        open={!!editing}
        row={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </div>
  );
}

