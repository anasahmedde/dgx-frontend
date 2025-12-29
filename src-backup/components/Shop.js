// src/components/Shop.js
import React, { useEffect, useState } from "react";
import { insertShop, listShops, updateShop, deleteShop } from "../api/shop";

/** Minimal modal (no deps). Hooks are always called; we show/hide with CSS. */
function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    display: open ? "grid" : "none",
    placeItems: "center",
    zIndex: 2000,
  };
  const card = {
    width: "min(92vw, 560px)",
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 20px 50px rgba(0,0,0,.2)",
    overflow: "hidden",
  };
  const header = {
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontWeight: 600,
  };
  const body = { padding: 16 };
  const footerBox = {
    padding: 16,
    borderTop: "1px solid #eee",
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
  };

  const closeBtn = {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
  };

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

export default function Shop() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");

  // rename modal state
  const [edit, setEdit] = useState(null); // { current: string, newName: string } | null

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    try {
      const res = await listShops(50, 0);
      // API returns { ok, items, total } directly
      setItems(res.items || []);
    } catch (e) {
      console.error("Failed to load shops:", e);
      setItems([]);
    }
  };

  const add = async () => {
    if (!name.trim()) return;
    await insertShop({ shop_name: name.trim() });
    setName("");
    load();
  };

  const openRename = (shop_name) => {
    setEdit({ current: shop_name, newName: shop_name });
  };

  const saveRename = async () => {
    if (!edit || !edit.newName.trim()) return;
    await updateShop(edit.current, { shop_name: edit.newName.trim() });
    setEdit(null);
    load();
  };

  const remove = async (shop_name) => {
    if (!window.confirm(`Delete shop "${shop_name}"?`)) return;
    await deleteShop(shop_name);
    load();
  };

  // styles
  const input = {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 14,
  };
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
  const btnDanger = { ...btn, background: "#dc2626", color: "#fff", borderColor: "#dc2626" };

  const row = {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: 8,
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px dashed #eee",
  };

  return (
    <div>
      <h2 style={{ fontSize: 28, margin: "0 0 12px" }}>Shops</h2>

      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          style={{ ...input, minWidth: 220 }}
          placeholder="search (q)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button style={btn} onClick={load}>Search</button>
      </div>

      {/* Add new */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          style={{ ...input, minWidth: 260 }}
          placeholder="new shop name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button style={btnPrimary} onClick={add}>Add Shop</button>
      </div>

      {/* List */}
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: "4px 12px" }}>
        <div style={{ ...row, fontWeight: 700, borderBottom: "1px solid #eee", paddingTop: 10, paddingBottom: 10 }}>
          <div>Name (ID)</div>
          <div>Update</div>
          <div>Delete</div>
        </div>

        {items.map((it) => (
          <div key={it.id} style={row}>
            <div>
              <span style={{ fontWeight: 600 }}>{it.shop_name}</span>
              <span style={{ color: "#6b7280", marginLeft: 8 }}>(id: {it.id})</span>
            </div>
            <div>
              <button style={btn} onClick={() => openRename(it.shop_name)}>Update</button>
            </div>
            <div>
              <button style={btnDanger} onClick={() => remove(it.shop_name)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Rename modal */}
      <Modal
        open={!!edit}
        title="Rename Shop"
        onClose={() => setEdit(null)}
        footer={
          <>
            <button style={btn} onClick={() => setEdit(null)}>Cancel</button>
            <button style={btnPrimary} onClick={saveRename}>Save</button>
          </>
        }
      >
        {edit && (
          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ fontSize: 12, color: "#6b7280" }}>Current name</label>
            <input style={{ ...input }} value={edit.current} disabled />

            <label style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>New name</label>
            <input
              autoFocus
              style={{ ...input }}
              value={edit.newName}
              onChange={(e) => setEdit((x) => ({ ...x, newName: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && saveRename()}
              placeholder="e.g. Downtown Mart"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
