import React, { useEffect, useState } from "react";
import { insertDevice, listDevices, updateDevice, deleteDevice } from "../api/device";

function Modal({ open, title, onClose, children, footer }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: open ? "grid" : "none", placeItems: "center", zIndex: 2000 };
  const card = { width: "min(92vw, 560px)", background: "#fff", borderRadius: 14, boxShadow: "0 20px 50px rgba(0,0,0,.2)", overflow: "hidden" };
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

export default function Device() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [mobileId, setMobileId] = useState("");
  const [status, setStatus] = useState(false);

  const [edit, setEdit] = useState(null); // { mobile_id, download_status }

  useEffect(() => { load(); }, []);

  const load = async () => {
    const res = await listDevices();
    setItems(res.data.items || []);
  };

  const add = async () => {
    if (!mobileId.trim()) return;
    await insertDevice(mobileId.trim(), status);
    setMobileId("");
    setStatus(false);
    load();
  };

  const openEdit = (it) => setEdit({ mobile_id: it.mobile_id, download_status: !!it.download_status });

  const saveEdit = async () => {
    if (!edit) return;
    await updateDevice(edit.mobile_id, { download_status: edit.download_status });
    setEdit(null);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm(`Delete device "${id}"?`)) return;
    await deleteDevice(id);
    load();
  };

  const input = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 14 };
  const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 };
  const btnPrimary = { ...btn, background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" };
  const btnDanger = { ...btn, background: "#dc2626", color: "#fff", borderColor: "#dc2626" };
  const row = { display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px dashed #eee" };

  const filtered = items.filter((d) => !q || String(d.mobile_id).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <h2 style={{ fontSize: 28, margin: "0 0 12px" }}>Device Management</h2>

      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input style={{ ...input, minWidth: 220 }} placeholder="search by Mobile ID" value={q} onChange={(e) => setQ(e.target.value)} />
        <button style={btn} onClick={load}>Reload</button>
      </div>

      {/* Add new */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <input style={{ ...input, minWidth: 220 }} placeholder="Mobile ID" value={mobileId} onChange={(e) => setMobileId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={status} onChange={(e) => setStatus(e.target.checked)} />
          Downloaded
        </label>
        <button style={btnPrimary} onClick={add}>Add Device</button>
      </div>

      {/* List */}
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: "4px 12px" }}>
        <div style={{ ...row, fontWeight: 700, borderBottom: "1px solid #eee", paddingTop: 10, paddingBottom: 10 }}>
          <div>Mobile ID (Status)</div>
          <div>Update</div>
          <div>Delete</div>
        </div>

        {filtered.map((it) => (
          <div key={it.id} style={row}>
            <div>
              <span style={{ fontWeight: 600 }}>{it.mobile_id}</span>
              <span style={{ color: "#6b7280", marginLeft: 8 }}>
                {it.download_status ? "✅ Downloaded" : "❌ Pending"}
              </span>
            </div>
            <div><button style={btn} onClick={() => openEdit(it)}>Update</button></div>
            <div><button style={btnDanger} onClick={() => remove(it.mobile_id)}>Delete</button></div>
          </div>
        ))}
      </div>

      {/* Update modal */}
      <Modal
        open={!!edit}
        title="Update Device"
        onClose={() => setEdit(null)}
        footer={
          <>
            <button style={btn} onClick={() => setEdit(null)}>Cancel</button>
            <button style={btnPrimary} onClick={saveEdit}>Save</button>
          </>
        }
      >
        {edit && (
          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ fontSize: 12, color: "#6b7280" }}>Mobile ID</label>
            <input style={{ ...input }} value={edit.mobile_id} disabled />
            <label style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>Downloaded</label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={edit.download_status} onChange={(e) => setEdit((x) => ({ ...x, download_status: e.target.checked }))} />
              Mark as downloaded
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}

