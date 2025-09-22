// src/App.js
import React, { useEffect, useState } from "react";
import Device from "./components/Device";
import Group from "./components/Group";
import Shop from "./components/Shop";
import Video from "./components/Video";
import Linker from "./components/Linker";
import RecentLinks from "./components/RecentLinks";   // <-- NEW

function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const overlay = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: open ? "grid" : "none", placeItems: "center", zIndex: 1000,
  };
  const card = {
    width: "min(92vw, 820px)", maxHeight: "80vh", background: "#fff",
    borderRadius: 14, boxShadow: "0 20px 50px rgba(0,0,0,.2)", overflow: "hidden",
    display: "flex", flexDirection: "column",
  };
  const header = {
    padding: "12px 16px", borderBottom: "1px solid #eee",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  };
  const body = { padding: 16, overflow: "auto" };
  const closeBtn = { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer" };

  return (
    <div style={overlay} onClick={onClose} role="dialog" aria-modal="true" aria-hidden={!open}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <strong>{title}</strong>
          <button style={closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={body}>{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [open, setOpen] = useState(null); // 'device' | 'group' | 'shop' | 'video' | 'add' | null
  const [linksRefresh, setLinksRefresh] = useState(0);  // <-- NEW

  const btn = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  };
  const btnPrimary = { ...btn, background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" };

  return (
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      <h1 style={{ marginBottom: 0 }}>FastAPI Admin</h1>

      {/* Top buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button style={btn} onClick={() => setOpen("device")}>Device</button>
        <button style={btn} onClick={() => setOpen("group")}>Group</button>
        <button style={btn} onClick={() => setOpen("shop")}>Shop</button>
        <button style={btn} onClick={() => setOpen("video")}>Video</button>
        <button style={btnPrimary} onClick={() => setOpen("add")}>Add</button>
      </div>

      {/* Front-page Recent Links table */}
      <RecentLinks refreshKey={linksRefresh} />   {/* <-- table on main page */}

      {/* Modals */}
      <Modal open={open === "device"} title="Device Management" onClose={() => setOpen(null)}>
        <Device key="device" />
      </Modal>

      <Modal open={open === "group"} title="Groups" onClose={() => setOpen(null)}>
        <Group key="group" />
      </Modal>

      <Modal open={open === "shop"} title="Shops" onClose={() => setOpen(null)}>
        <Shop key="shop" />
      </Modal>

      <Modal open={open === "video"} title="Videos" onClose={() => setOpen(null)}>
        <Video key="video" />
      </Modal>

      <Modal open={open === "add"} title="Create Relation (Device • Group • Shop • Video)" onClose={() => setOpen(null)}>
        <Linker key="linker" onChanged={() => setLinksRefresh((x) => x + 1)} /> {/* notify table */}
      </Modal>
    </div>
  );
}
