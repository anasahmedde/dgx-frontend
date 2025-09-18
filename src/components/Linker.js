// src/components/Linker.js
import React, { useEffect, useState } from "react";
import { listDevices } from "../api/device";
import { listGroups } from "../api/group";
import { listShops } from "../api/shop";
import { listVideos } from "../api/video";
import { createLink, listLinks, deleteLink } from "../api/link";

export default function Linker({ onChanged }) {
  // lists
  const [devices, setDevices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [shops, setShops] = useState([]);
  const [videos, setVideos] = useState([]);

  // selections
  const [mobileId, setMobileId] = useState("");
  const [gname, setGname] = useState("");
  const [shopName, setShopName] = useState("");
  const [videoName, setVideoName] = useState("");

  // recent links
  const [links, setLinks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retry helper for endpoints that 422 on high limits
  const withLimitFallback = async (fn, params, caps = [100, 50]) => {
    try {
      const r = await fn(params);
      return r.data.items || [];
    } catch (e) {
      if (e?.response?.status === 422 && params?.limit) {
        for (const cap of caps) {
          try {
            const r2 = await fn({ ...params, limit: cap });
            return r2.data.items || [];
          } catch (e2) {
            if (e2?.response?.status !== 422) throw e2;
          }
        }
        const r3 = await fn({});
        return r3.data.items || [];
      }
      throw e;
    }
  };

  const loadAll = async () => {
    setBusy(true);
    setMsg("");
    try {
      const MAX = 100;
      const [d, g, s, v, l] = await Promise.all([
        listDevices().then((r) => r.data.items || []),
        withLimitFallback(listGroups, { limit: MAX, offset: 0 }),
        withLimitFallback(listShops, { limit: MAX, offset: 0 }),
        withLimitFallback(listVideos, { limit: MAX, offset: 0 }),
        listLinks({ limit: 50, offset: 0 }).then((r) => r.data.items || []),
      ]);
      setDevices(d);
      setGroups(g);
      setShops(s);
      setVideos(v);
      setLinks(l);
    } catch (e) {
      setMsg(`Failed to load: ${e?.response?.data?.detail || e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setMobileId("");
    setGname("");
    setShopName("");
    setVideoName("");
  };

  const add = async () => {
    if (!mobileId || !gname || !shopName || !videoName) {
      setMsg("Please select Device, Group, Shop, and Video.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await createLink({ mobile_id: mobileId, gname, shop_name: shopName, video_name: videoName });
      setMsg("Link created ✅");
      clear();
      const l = await listLinks({ limit: 50, offset: 0 });
      setLinks(l.data.items || []);
      onChanged && onChanged();
    } catch (e) {
      setMsg(`Failed: ${e?.response?.data?.detail || e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this link?")) return;
    setBusy(true);
    try {
      await deleteLink(id);
      setLinks((x) => x.filter((r) => r.id !== id));
      onChanged && onChanged();
    } catch (e) {
      setMsg(`Delete failed: ${e?.response?.data?.detail || e.message}`);
    } finally {
      setBusy(false);
    }
  };

  // styles
  const input = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 14, background: "#fff" };
  const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 };
  const btnPrimary = { ...btn, background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" };
  const btnDanger = { ...btn, background: "#dc2626", color: "#fff", borderColor: "#dc2626" };
  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
  const row = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px dashed #eee" };
  const section = { background: "#fff" };

  return (
    <div style={section}>
      <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>Create Relation (Device • Group • Shop • Video)</h2>

      <div style={grid2}>
        <div>
          <label style={{ fontSize: 12, color: "#6b7280" }}>Device (mobile_id)</label>
          <select style={{ ...input, width: "100%" }} value={mobileId} onChange={(e) => setMobileId(e.target.value)}>
            <option value="">Select device…</option>
            {devices.map((d) => (
              <option key={d.id} value={d.mobile_id}>{d.mobile_id}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "#6b7280" }}>Group (gname)</label>
          <select style={{ ...input, width: "100%" }} value={gname} onChange={(e) => setGname(e.target.value)}>
            <option value="">Select group…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.gname}>{g.gname}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "#6b7280" }}>Shop (shop_name)</label>
          <select style={{ ...input, width: "100%" }} value={shopName} onChange={(e) => setShopName(e.target.value)}>
            <option value="">Select shop…</option>
            {shops.map((s) => (
              <option key={s.id} value={s.shop_name}>{s.shop_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "#6b7280" }}>Video (video_name)</label>
          <select style={{ ...input, width: "100%" }} value={videoName} onChange={(e) => setVideoName(e.target.value)}>
            <option value="">Select video…</option>
            {videos.map((v) => (
              <option key={v.id} value={v.video_name}>{v.video_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
        <button style={btn} onClick={loadAll} disabled={busy}>Reload lists</button>
        <button style={btnPrimary} onClick={add} disabled={busy}>Create Link</button>
        {msg && (
          <span
            style={{
              marginLeft: 8,
              color: msg.startsWith("Failed") || msg.startsWith("Delete failed") ? "#dc2626" : "#16a34a",
              fontSize: 13,
            }}
          >
            {busy ? "Working…" : msg}
          </span>
        )}
      </div>

      {/* Recent links (inside modal too) */}
      <h3 style={{ marginTop: 18, marginBottom: 8 }}>Recent Links</h3>
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: "4px 12px" }}>
        <div style={{ ...row, fontWeight: 700, borderBottom: "1px solid #eee", paddingTop: 10, paddingBottom: 10 }}>
          <div>Device</div>
          <div>Group</div>
          <div>Shop</div>
          <div>Video</div>
          <div>Delete</div>
        </div>
        {links.map((l) => (
          <div key={l.id} style={row}>
            <div>{l.mobile_id}</div>
            <div>{l.gname}</div>
            <div>{l.shop_name}</div>
            <div>{l.video_name}</div>
            <div><button style={btnDanger} onClick={() => remove(l.id)} disabled={busy}>Delete</button></div>
          </div>
        ))}
        {links.length === 0 && !busy && (
          <div style={{ padding: "10px 0", color: "#6b7280" }}>No links yet.</div>
        )}
      </div>
    </div>
  );
}

