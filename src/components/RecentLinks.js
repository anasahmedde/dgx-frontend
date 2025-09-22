// src/components/RecentLinks.js
import React, { useEffect, useMemo, useState } from "react";
import { listLinks, deleteLink } from "../api/link";

export default function RecentLinks({ refreshKey = 0 }) {
  const [links, setLinks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState(null);

  // search boxes
  const [search, setSearch] = useState({
    mobile_id: "",
    gname: "",
    shop_name: "",
    video_name: "",
  });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const extractError = (e) => {
    const d = e?.response?.data?.detail;
    if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join("; ");
    if (typeof d === "string") return d;
    return e?.message || "Request failed";
  };

  // Try high limits, fall back if the API validates with a lower max (422)
  const fetchWithLimitFallback = async () => {
    for (const cap of [200, 100, 50]) {
      try {
        const r = await listLinks({ limit: cap, offset: 0 });
        return r.data.items || [];
      } catch (e) {
        if (e?.response?.status !== 422) throw e; // only fall back on 422 validation errors
      }
    }
    // final attempt with API defaults
    const r = await listLinks({});
    return r.data.items || [];
  };

  const load = async () => {
    setBusy(true);
    setMsg("");
    try {
      const items = await fetchWithLimitFallback();
      setLinks(items);
      setLastLoadedAt(new Date());
    } catch (e) {
      setMsg(`Failed to load: ${extractError(e)}`);
      setLinks([]); // clean empty state
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this link?")) return;
    setBusy(true);
    try {
      await deleteLink(id);
      setLinks((xs) => xs.filter((r) => r.id !== id));
    } catch (e) {
      setMsg(`Delete failed: ${extractError(e)}`);
    } finally {
      setBusy(false);
    }
  };

  // client-side filtering
  const ci = (a = "", b = "") => String(a).toLowerCase().includes(String(b).toLowerCase());
  const filtered = useMemo(() => {
    const f = search;
    return (links || []).filter(
      (row) =>
        (!f.mobile_id || ci(row.mobile_id, f.mobile_id)) &&
        (!f.gname || ci(row.gname, f.gname)) &&
        (!f.shop_name || ci(row.shop_name, f.shop_name)) &&
        (!f.video_name || ci(row.video_name, f.video_name))
    );
  }, [links, search]);

  // styles
  const input = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 14 };
  const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 };
  const btnPrimary = { ...btn, background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" };
  const btnDanger = { ...btn, background: "#dc2626", color: "#fff", borderColor: "#dc2626" };
  const row = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px dashed #eee" };

  return (
    <div>
      {/* Header + Reload */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: "16px 0 8px" }}>Recent Links</h2>
        <button
          style={btnPrimary}
          onClick={load}
          disabled={busy}
          title="Reload recent links"
          aria-label="Reload recent links"
        >
          {busy ? "Reloading…" : "Reload"}
        </button>
        {lastLoadedAt && (
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Last loaded: {lastLoadedAt.toLocaleTimeString()}
          </span>
        )}
        {msg && <span style={{ fontSize: 13, color: "#dc2626" }}>{msg}</span>}
      </div>

      {/* Search inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 12 }}>
        <input
          style={input}
          placeholder="Device (mobile_id)"
          value={search.mobile_id}
          onChange={(e) => setSearch((s) => ({ ...s, mobile_id: e.target.value }))}
        />
        <input
          style={input}
          placeholder="Group (gname)"
          value={search.gname}
          onChange={(e) => setSearch((s) => ({ ...s, gname: e.target.value }))}
        />
        <input
          style={input}
          placeholder="Shop (shop_name)"
          value={search.shop_name}
          onChange={(e) => setSearch((s) => ({ ...s, shop_name: e.target.value }))}
        />
        <input
          style={input}
          placeholder="Video (video_name)"
          value={search.video_name}
          onChange={(e) => setSearch((s) => ({ ...s, video_name: e.target.value }))}
        />
        <button
          style={btn}
          onClick={() => setSearch({ mobile_id: "", gname: "", shop_name: "", video_name: "" })}
          title="Clear filters"
        >
          Clear
        </button>
      </div>

      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
        Showing {filtered.length} of {links.length}
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: "4px 12px" }}>
        <div style={{ ...row, fontWeight: 700, borderBottom: "1px solid #eee", paddingTop: 10, paddingBottom: 10 }}>
          <div>Device</div>
          <div>Group</div>
          <div>Shop</div>
          <div>Video</div>
          <div>Delete</div>
        </div>

        {filtered.map((l) => (
          <div key={l.id} style={row}>
            <div>{l.mobile_id}</div>
            <div>{l.gname}</div>
            <div>{l.shop_name}</div>
            <div>{l.video_name}</div>
            <div>
              <button style={btnDanger} onClick={() => remove(l.id)} disabled={busy}>
                Delete
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: "10px 0", color: "#6b7280" }}>{busy ? "Loading…" : "No matches."}</div>
        )}
      </div>
    </div>
  );
}

