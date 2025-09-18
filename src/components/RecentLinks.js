// src/components/RecentLinks.js
import React, { useEffect, useState } from "react";
import { listLinks, deleteLink } from "../api/link";

export default function RecentLinks({ refreshKey = 0 }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setBusy(true);
    setMsg("");
    try {
      // backend caps are le=100; keep under that to avoid 422
      const res = await listLinks({ limit: 100, offset: 0 });
      setItems(res.data.items || []);
    } catch (e) {
      setMsg(`Load failed: ${e?.response?.data?.detail || e.message}`);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const remove = async (id) => {
    if (!window.confirm("Delete this link?")) return;
    setBusy(true);
    try {
      await deleteLink(id);
      setItems((x) => x.filter((r) => r.id !== id));
    } catch (e) {
      setMsg(`Delete failed: ${e?.response?.data?.detail || e.message}`);
    } finally {
      setBusy(false);
    }
  };

  // styles
  const card = {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,.06)",
  };
  const h = { margin: 0, fontSize: 18 };
  const table = { width: "100%", borderCollapse: "collapse" };
  const th = { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #eee", fontWeight: 700 };
  const td = { padding: "12px 8px", borderBottom: "1px dashed #eee", verticalAlign: "top" };
  const btn = {
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid #ef4444",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  };
  const headerRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  };
  const reloadBtn = {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  };

  return (
    <div style={card}>
      <div style={headerRow}>
        <h3 style={h}>Recent Links</h3>
        <button style={reloadBtn} onClick={load} disabled={busy}>
          {busy ? "Loading…" : "Reload"}
        </button>
      </div>

      {msg && (
        <div style={{ marginBottom: 8, color: msg.startsWith("Load failed") || msg.startsWith("Delete failed") ? "#dc2626" : "#16a34a" }}>
          {msg}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Device</th>
              <th style={th}>Group</th>
              <th style={th}>Shop</th>
              <th style={th}>Video</th>
              <th style={th}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id}>
                <td style={td}>{l.mobile_id}</td>
                <td style={td}>{l.gname}</td>
                <td style={td}>{l.shop_name}</td>
                <td style={td}>{l.video_name}</td>
                <td style={td}>
                  <button style={btn} onClick={() => remove(l.id)} disabled={busy}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !busy && (
              <tr>
                <td style={td} colSpan={5}>&mdash; No links yet &mdash;</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

