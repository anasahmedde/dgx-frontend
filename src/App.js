// src/App.js - Enhanced Modern UI
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

/* ======================== Modern Modal ======================== */
function Modal({ open, title, onClose, children, size = "lg" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "480px",
    md: "640px",
    lg: "820px",
    xl: "1024px",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: `min(95vw, ${sizes[size]})`,
          maxHeight: "90vh",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          borderRadius: 20,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
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
          <h3 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 600 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.background = "rgba(255,255,255,0.3)")}
            onMouseOut={(e) => (e.target.style.background = "rgba(255,255,255,0.2)")}
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: 20, overflow: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

/* ======================== Login View ======================== */
function LoginView({ onSuccess }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 500)); // Simulate loading

    const u = (user || "").trim().toLowerCase();
    const p = pass || "";

    if (u === AUTH_USER.toLowerCase() && p === AUTH_PASS) {
      localStorage.setItem(STORAGE_KEY, "1");
      onSuccess();
    } else {
      setErr("Invalid username or password.");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 20,
      }}
    >
      <div
        style={{
          width: 400,
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          padding: 40,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 10px 40px -10px rgba(102, 126, 234, 0.5)",
            }}
          >
            <span style={{ color: "#fff", fontSize: 28, fontWeight: 800 }}>D</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#1e293b" }}>DIGIX</h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
            Digital Signage Management
          </p>
        </div>

        <form onSubmit={submit} style={{ display: "grid", gap: 20 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151", fontSize: 14 }}>
              Username
            </label>
            <input
              autoFocus
              placeholder="Enter username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: "2px solid #e5e7eb",
                fontSize: 15,
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151", fontSize: 14 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: "2px solid #e5e7eb",
                fontSize: 15,
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {err && (
            <div
              style={{
                padding: "12px 16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 12,
                color: "#dc2626",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>⚠️</span> {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 24px",
              background: loading ? "#94a3b8" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 14px 0 rgba(102, 126, 234, 0.4)",
            }}
            onMouseOver={(e) => !loading && (e.target.style.transform = "translateY(-1px)")}
            onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          Demo: <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>Digix</code> /{" "}
          <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>digix@0090</code>
        </div>
      </div>
    </div>
  );
}

/* ======================== Main App ======================== */
export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");
  const [open, setOpen] = useState(null);
  const [linksRefresh, setLinksRefresh] = useState(0);

  if (!authed) {
    return <LoginView onSuccess={() => setAuthed(true)} />;
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
  };

  const NavButton = ({ children, onClick, primary, icon }) => (
    <button
      onClick={onClick}
      style={{
        padding: "12px 20px",
        borderRadius: 12,
        border: primary ? "none" : "2px solid #e5e7eb",
        background: primary ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#fff",
        color: primary ? "#fff" : "#374151",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "all 0.2s",
        boxShadow: primary ? "0 4px 14px 0 rgba(102, 126, 234, 0.4)" : "0 2px 4px rgba(0,0,0,0.05)",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = primary
          ? "0 6px 20px 0 rgba(102, 126, 234, 0.5)"
          : "0 4px 12px rgba(0,0,0,0.1)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = primary
          ? "0 4px 14px 0 rgba(102, 126, 234, 0.4)"
          : "0 2px 4px rgba(0,0,0,0.05)";
      }}
    >
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      {children}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>D</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1e293b" }}>DIGIX</h1>
        </div>

        <button
          onClick={logout}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#fff",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          <span>🚪</span> Logout
        </button>
      </header>

      {/* Main Content */}
      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        {/* Navigation Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <NavButton onClick={() => setOpen("device")} icon="📱">
            Device
          </NavButton>
          <NavButton onClick={() => setOpen("group")} icon="👥">
            Group
          </NavButton>
          <NavButton onClick={() => setOpen("shop")} icon="🏪">
            Shop
          </NavButton>
          <NavButton onClick={() => setOpen("video")} icon="🎬">
            Video
          </NavButton>
          <NavButton onClick={() => setOpen("add")} icon="➕">
            Add
          </NavButton>
          <NavButton onClick={() => setOpen("group-video")} icon="🔗" primary>
            Group Linked Video
          </NavButton>
        </div>

        {/* Recent Links */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <RecentLinks refreshKey={linksRefresh} />
        </div>
      </main>

      {/* Modals */}
      <Modal open={open === "device"} title="📱 Device Management" onClose={() => setOpen(null)}>
        <Device onChanged={() => setLinksRefresh((x) => x + 1)} />
      </Modal>

      <Modal open={open === "group"} title="👥 Groups" onClose={() => setOpen(null)}>
        <Group />
      </Modal>

      <Modal open={open === "shop"} title="🏪 Shops" onClose={() => setOpen(null)}>
        <Shop />
      </Modal>

      <Modal open={open === "video"} title="🎬 Videos" onClose={() => setOpen(null)} size="xl">
        <Video />
      </Modal>

      <Modal open={open === "add"} title="➕ Add New Device" onClose={() => setOpen(null)}>
        <Device onChanged={() => setLinksRefresh((x) => x + 1)} />
      </Modal>

      <Modal open={open === "group-video"} title="🔗 Group Linked Video" onClose={() => setOpen(null)}>
        <GroupLinkedVideo onDone={() => setLinksRefresh((x) => x + 1)} />
      </Modal>

      {/* Global Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      `}</style>
    </div>
  );
}
