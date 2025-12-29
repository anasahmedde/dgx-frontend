// src/components/Group.js - Enhanced Modern UI
import React, { useEffect, useState } from "react";
import { insertGroup, listGroups, updateGroup, deleteGroup } from "../api/group";

/* ======================== Styles ======================== */
const styles = {
  input: {
    padding: "12px 16px",
    borderRadius: 10,
    border: "2px solid #e5e7eb",
    fontSize: 14,
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  btn: {
    padding: "12px 20px",
    borderRadius: 10,
    border: "none",
    background: "#f1f5f9",
    color: "#475569",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.2s",
  },
  btnPrimary: {
    padding: "12px 20px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
    transition: "all 0.2s",
  },
  btnDanger: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "all 0.2s",
  },
};

/* ======================== Modal ======================== */
function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(95vw, 480px)",
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
      >
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
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================== Main Component ======================== */
export default function Group() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [gname, setGname] = useState("");
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listGroups(50, 0);
      setItems(res.items || []);
    } catch (e) {
      console.error("Failed to load groups:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const add = async () => {
    if (!gname.trim()) return;
    await insertGroup({ gname: gname.trim() });
    setGname("");
    load();
  };

  const openRename = (name) => setEdit({ current: name, newName: name });

  const saveRename = async () => {
    if (!edit || !edit.newName.trim()) return;
    await updateGroup(edit.current, { gname: edit.newName.trim() });
    setEdit(null);
    load();
  };

  const remove = async (name) => {
    if (!window.confirm(`Delete group "${name}"?`)) return;
    await deleteGroup(name);
    load();
  };

  const filteredItems = items.filter((it) =>
    (it.gname || "").toLowerCase().includes((q || "").toLowerCase())
  );

  return (
    <div>
      {/* Add New Group */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          padding: 20,
          background: "#f8fafc",
          borderRadius: 16,
        }}
      >
        <input
          style={{ ...styles.input, flex: 1 }}
          placeholder="Enter new group name..."
          value={gname}
          onChange={(e) => setGname(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button style={styles.btnPrimary} onClick={add}>
          ➕ Add Group
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          style={styles.input}
          placeholder="🔍 Search groups..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Groups List */}
      <div style={{ display: "grid", gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            Loading groups...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
            <div style={{ color: "#64748b" }}>No groups found</div>
          </div>
        ) : (
          filteredItems.map((it) => (
            <div
              key={it.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                background: "#fff",
                border: "2px solid #f1f5f9",
                borderRadius: 12,
                transition: "all 0.2s",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, color: "#1e293b" }}>
                  {it.gname}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                  ID: {it.id}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={styles.btn} onClick={() => openRename(it.gname)}>
                  ✏️ Edit
                </button>
                <button style={styles.btnDanger} onClick={() => remove(it.gname)}>
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rename Modal */}
      <Modal
        open={!!edit}
        title="✏️ Rename Group"
        onClose={() => setEdit(null)}
        footer={
          <>
            <button style={styles.btn} onClick={() => setEdit(null)}>
              Cancel
            </button>
            <button style={styles.btnPrimary} onClick={saveRename}>
              Save Changes
            </button>
          </>
        }
      >
        {edit && (
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "#64748b" }}>
                Current Name
              </label>
              <input style={{ ...styles.input, background: "#f8fafc" }} value={edit.current} disabled />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "#374151" }}>
                New Name
              </label>
              <input
                autoFocus
                style={styles.input}
                value={edit.newName}
                onChange={(e) => setEdit((x) => ({ ...x, newName: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && saveRename()}
                placeholder="e.g. North Region"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
