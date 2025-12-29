// src/App.js
import React, { useEffect, useState } from "react";
import Device from "./components/Device";
import Group from "./components/Group";
import Shop from "./components/Shop";
import Video from "./components/Video";
import RecentLinks from "./components/RecentLinks";
import GroupLinkedVideo from "./components/GroupLinkedVideo";

const AUTH_USER = "Digix";
const AUTH_PASS = "digix@0090";
const STORAGE_KEY = "digix_auth_v1";

/* -------------------------- Small UI helpers -------------------------- */

function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: open ? "grid" : "none",
    placeItems: "center",
    zIndex: 1000,
  };
  const card = {
    width: "min(92vw, 820px)",
    maxHeight: "80vh",
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 20px 50px rgba(0,0,0,.2)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };
  const header = {
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };
  const body = { padding: 16, overflow: "auto" };
  const closeBtn = {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
  };

  return (
    <div style={overlay} onClick={onClose} role="dialog" aria-modal="true" aria-hidden={!open}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <strong>{title}</strong>
          <button style={closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div style={body}>{children}</div>
      </div>
    </div>
  );
}

/* ----------------------------- Login view ----------------------------- */

function LoginView({ onSuccess }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const wrap = {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(180deg,#f3f4f6,#ffffff)",
    padding: 20,
  };
  const card = {
    width: 360,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,.08)",
    padding: 20,
    display: "grid",
    gap: 14,
  };
  const input = {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    width: "100%",
    outline: "none",
  };
  const btnPrimary = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #4f46e5",
    background: "#4f46e5",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  };

  const submit = (e) => {
    e.preventDefault();
    setErr("");

    const u = (user || "").trim().toLowerCase();
    const p = pass || "";

    if (u === AUTH_USER.toLowerCase() && p === AUTH_PASS) {
      localStorage.setItem(STORAGE_KEY, "1");
      onSuccess();
    } else {
      setErr("Invalid username or password.");
    }
  };

  return (
    <div style={wrap}>
      <form style={card} onSubmit={submit}>
        <div style={{ textAlign: "center", marginBottom: 2 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 0.4 }}>DIGIX</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Please sign in</div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Username</label>
          <input
            style={input}
            autoFocus
            placeholder="Digix"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Password</label>
          <input
            style={input}
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </div>

        {err && (
          <div
            style={{
              fontSize: 13,
              color: "#b91c1c",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "8px 10px",
            }}
          >
            {err}
          </div>
        )}

        <button type="submit" style={btnPrimary}>
          Sign in
        </button>

        <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>
          Hint: <b>Digix</b> / <b>digix@0090</b>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------ Main app ------------------------------ */

export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");
  const [open, setOpen] = useState(null); // 'device' | 'group' | 'shop' | 'video' | 'group-video' | null
  const [linksRefresh, setLinksRefresh] = useState(0);

  if (!authed) {
    return <LoginView onSuccess={() => setAuthed(true)} />;
  }

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

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
  };

  return (
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ marginBottom: 0 }}>DIGIX</h1>
        <button onClick={logout} style={btn} title="Log out">
          Logout
        </button>
      </div>

      {/* Top buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button style={btn} onClick={() => setOpen("device")}>
          Device
        </button>
        <button style={btn} onClick={() => setOpen("group")}>
          Group
        </button>
        <button style={btn} onClick={() => setOpen("shop")}>
          Shop
        </button>
        <button style={btn} onClick={() => setOpen("video")}>
          Video
        </button>

        <button style={btnPrimary} onClick={() => setOpen("group-video")}>
          Group linked video
        </button>
      </div>

      {/* Recent links on landing */}
      <RecentLinks refreshKey={linksRefresh} />

      {/* Modals */}
      <Modal open={open === "device"} title="Device Management" onClose={() => setOpen(null)}>
        <Device onChanged={() => setLinksRefresh((x) => x + 1)} />
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

      <Modal open={open === "group-video"} title="Group linked video" onClose={() => setOpen(null)}>
        <GroupLinkedVideo onDone={() => setLinksRefresh((x) => x + 1)} />
      </Modal>
    </div>
  );
}

