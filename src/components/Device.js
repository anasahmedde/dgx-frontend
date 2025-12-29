// src/components/Device.js
// Device Management with server-side pagination (minimal: Prev/Next + page size)
import React, { useEffect, useMemo, useState } from "react";
import { listDevices, insertDevice, deleteDevice } from "../api/device";
import { listGroupNames } from "../api/group";
import { listShopNames } from "../api/shop";
import axios from "axios";

// DVSG API for device creation with linking
const DVSG_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:8005`;

const dvsgApi = axios.create({
  baseURL: DVSG_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

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
    background: "rgba(17,24,39,.55)",
    display: open ? "grid" : "none",
    placeItems: "center",
    zIndex: 2000,
    padding: 16,
  };

  const card = {
    width: "min(92vw, 980px)",
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 20px 60px rgba(0,0,0,.25)",
    overflow: "hidden",
  };

  const header = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    color: "white",
    background: "linear-gradient(90deg, #5b7cfa, #7c4bc9)",
  };

  const closeBtn = {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "none",
    background: "rgba(255,255,255,.18)",
    color: "white",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: "34px",
  };

  return (
    <div style={overlay} onMouseDown={onClose}>
      <div style={card} onMouseDown={(e) => e.stopPropagation()}>
        <div style={header}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <button style={closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div style={{ padding: 14 }}>{children}</div>

        {footer ? (
          <div style={{ padding: 14, borderTop: "1px solid #e5e7eb" }}>{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

function fmtDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function prettyErrText(s) {
  if (!s) return "";
  try {
    const obj = JSON.parse(s);
    if (Array.isArray(obj)) return obj?.[0]?.msg || s;
    if (obj?.detail && Array.isArray(obj.detail)) return obj.detail?.[0]?.msg || s;
    if (obj?.msg) return obj.msg;
    return s;
  } catch {
    return s;
  }
}

export default function Device() {
  const [open, setOpen] = useState(false);

  // list data
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // search input vs applied search
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");

  // pagination
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1); // 1-based

  const totalPages = useMemo(() => {
    const t = Number(total || 0);
    const ps = Number(pageSize || 10);
    return Math.max(1, Math.ceil(t / ps));
  }, [total, pageSize]);

  const fromRow = useMemo(() => {
    if (!total) return 0;
    return (page - 1) * pageSize + 1;
  }, [total, page, pageSize]);

  const toRow = useMemo(() => {
    if (!total) return 0;
    return Math.min(total, (page - 1) * pageSize + (items?.length || 0));
  }, [total, page, pageSize, items]);

  const [errText, setErrText] = useState("");
  const [fkDetail, setFkDetail] = useState(null);

  // Two-step add modal
  const [addOpen, setAddOpen] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Mobile ID, Step 2: Group & Shop

  // Form data
  const [mobileId, setMobileId] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const [group, setGroup] = useState("");
  const [shop, setShop] = useState("");

  // Dropdown data
  const [groups, setGroups] = useState([]);
  const [shops, setShops] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState("");

  const canProceedToStep2 = useMemo(() => (mobileId ?? "").trim().length > 0, [mobileId]);
  const canSubmit = useMemo(() => mobileId.trim() && group && shop, [mobileId, group, shop]);

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
  };

  const btn = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    background: "#6d5efc",
    color: "white",
    boxShadow: "0 10px 24px rgba(109,94,252,.25)",
  };

  const btnGhost = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    fontWeight: 700,
    background: "white",
  };

  const btnSuccess = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    background: "#10b981",
    color: "white",
  };

  const btnDanger = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
    background: "#ef4444",
    color: "white",
  };

  const btnTiny = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    fontWeight: 800,
    background: "white",
  };

  const btnTinyDisabled = {
    ...btnTiny,
    opacity: 0.45,
    cursor: "not-allowed",
  };

  // Load groups and shops for step 2
  const loadLists = async () => {
    setLoadingLists(true);
    setErrText("");
    try {
      const [gnames, snames] = await Promise.all([listGroupNames(""), listShopNames("")]);
      setGroups(gnames || []);
      setShops(snames || []);
      if (!group && gnames?.length) setGroup(gnames[0]);
      if (!shop && snames?.length) setShop(snames[0]);
    } catch (e) {
      console.error("Failed to load groups/shops:", e);
      setErrText("Failed to load groups/shops");
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    if (addOpen && step === 2) loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOpen, step]);

  const loadPage = async (p = page, ps = pageSize, qx = qApplied) => {
    setLoading(true);
    setErrText("");
    setFkDetail(null);

    const safeP = Math.max(1, Number(p || 1));
    const safePS = Math.max(1, Number(ps || 10));
    const offset = (safeP - 1) * safePS;

    const r = await listDevices(safePS, offset, qx);
    if (!r.ok) {
      setErrText(prettyErrText(r.error || "Network Error"));
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    const newTotal = Number(r.total ?? 0);
    const newPages = Math.max(1, Math.ceil(newTotal / safePS));

    // if current page is out of range (after deletions), move back
    if (safeP > newPages && newTotal > 0) {
      setTotal(newTotal);
      setPage(newPages);
      setLoading(false);
      return;
    }

    setItems(r.items || []);
    setTotal(newTotal);
    setLoading(false);
  };

  // initial load + reload when page/pageSize changes (only when modal open)
  useEffect(() => {
    if (!open) return;
    loadPage(page, pageSize, qApplied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page, pageSize]);

  const onSearch = async () => {
    const nextQ = (q || "").trim();
    setQApplied(nextQ);
    setPage(1);
    // load will happen via effect (open/page change). But run once immediately for snappy UI:
    if (open) await loadPage(1, pageSize, nextQ);
  };

  const onRefresh = async () => {
    if (!open) return;
    await loadPage(page, pageSize, qApplied);
  };

  const onDelete = async (row) => {
    const mid = row?.mobile_id;
    if (!mid) return;

    const ok = window.confirm(`Delete device "${mid}"?`);
    if (!ok) return;

    setErrText("");
    setFkDetail(null);

    const r = await deleteDevice(mid);
    if (r.ok) {
      // reload current page; if it becomes empty, go back one page
      const offset = (page - 1) * pageSize;
      const rr = await listDevices(pageSize, offset, qApplied);
      if (rr.ok) {
        if ((rr.items || []).length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }
        setItems(rr.items || []);
        setTotal(Number(rr.total ?? 0));
        return;
      }
      await loadPage(page, pageSize, qApplied);
      return;
    }

    if (r.status === 409 && r.detailObj) {
      setErrText(r.detailObj.message || "Device is linked with other records.");
      setFkDetail(r.detailObj);
      return;
    }

    setErrText(prettyErrText(r.error || "Failed to delete"));
  };

  const handleOpenAddModal = () => {
    setAddOpen(true);
    setStep(1);
    setMobileId("");
    setDownloaded(false);
    setGroup("");
    setShop("");
    setSuccess("");
    setErrText("");
  };

  const handleProceedToStep2 = () => {
    if (canProceedToStep2) setStep(2);
  };

  const handleBack = () => setStep(1);

  // Add device with linking (new flow)
  const addDeviceWithLinking = async () => {
    if (!canSubmit) return;
    setAdding(true);
    setErrText("");
    setSuccess("");

    const id = mobileId.trim();

    try {
      const response = await dvsgApi.post("/device/create", {
        mobile_id: id,
        group_name: group,
        shop_name: shop,
      });

      if (response.data) {
        setSuccess(`Device ${id} created and linked successfully!`);
        setTimeout(async () => {
          setMobileId("");
          setDownloaded(false);
          setStep(1);
          setAddOpen(false);
          setSuccess("");
          setPage(1);
          await loadPage(1, pageSize, qApplied);
        }, 800);
      }
    } catch (e) {
      console.error("Create device error:", e);
      // Fallback to old method
      try {
        await insertDevice({ mobile_id: id, download_status: downloaded });
        setSuccess(`Device ${id} added successfully!`);
        setTimeout(async () => {
          setMobileId("");
          setDownloaded(false);
          setStep(1);
          setAddOpen(false);
          setSuccess("");
          setPage(1);
          await loadPage(1, pageSize, qApplied);
        }, 800);
      } catch (e2) {
        setErrText(e2?.response?.data?.detail || e2?.message || "Failed to add device");
      }
    } finally {
      setAdding(false);
    }
  };

  // Create device without linking (just mobile_id)
  const addDeviceOnly = async () => {
    if (!mobileId.trim()) return;
    setAdding(true);
    setErrText("");
    setSuccess("");

    try {
      await insertDevice({ mobile_id: mobileId.trim(), download_status: downloaded });
      setSuccess(`Device ${mobileId.trim()} created! You can link it to a group later.`);
      setTimeout(async () => {
        setMobileId("");
        setDownloaded(false);
        setAddOpen(false);
        setSuccess("");
        setPage(1);
        await loadPage(1, pageSize, qApplied);
      }, 800);
    } catch (e) {
      setErrText(e?.response?.data?.detail || e?.message || "Failed to create device");
    } finally {
      setAdding(false);
    }
  };

  const paginationBar = (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 12,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#6b7280", fontSize: 13 }}>
        <div>
          Showing <b>{fromRow}</b>-<b>{toRow}</b> of <b>{total}</b>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            style={{ ...inputStyle, width: 90, padding: "8px 10px" }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          Page <b>{page}</b> / <b>{totalPages}</b>
        </div>

        <button
          style={page <= 1 ? btnTinyDisabled : btnTiny}
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ← Prev
        </button>

        <button
          style={page >= totalPages ? btnTinyDisabled : btnTiny}
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next →
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <button
        style={btn}
        onClick={() => {
          setOpen(true);
          // reset to first page when opening (optional but nice)
          setPage(1);
        }}
      >
        Devices
      </button>

      <Modal
        open={open}
        title="📱 Device Management"
        onClose={() => setOpen(false)}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Total: <b>{total}</b>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={btnGhost} onClick={onRefresh} disabled={loading}>
                Refresh
              </button>
              <button style={btn} onClick={handleOpenAddModal}>
                + Add Device
              </button>
            </div>
          </div>
        }
      >
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by mobile id..."
            style={{ ...inputStyle, flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />
          <button style={btnGhost} onClick={onSearch} disabled={loading}>
            Search
          </button>
        </div>

        {errText ? (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: 10,
              borderRadius: 10,
              marginBottom: 10,
              fontWeight: 600,
            }}
          >
            {errText}
          </div>
        ) : null}

        {fkDetail?.recent_links?.length ? (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Recent linked records</div>
            <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={{ padding: 10, fontSize: 12, color: "#6b7280" }}>Link ID</th>
                    <th style={{ padding: 10, fontSize: 12, color: "#6b7280" }}>Group</th>
                    <th style={{ padding: 10, fontSize: 12, color: "#6b7280" }}>Shop</th>
                    <th style={{ padding: 10, fontSize: 12, color: "#6b7280" }}>Video</th>
                    <th style={{ padding: 10, fontSize: 12, color: "#6b7280" }}>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {fkDetail.recent_links.map((x) => (
                    <tr key={x.link_id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: 10, fontWeight: 700 }}>{x.link_id}</td>
                      <td style={{ padding: 10 }}>{x.gname || x.gid}</td>
                      <td style={{ padding: 10 }}>{x.shop_name || x.sid}</td>
                      <td style={{ padding: 10 }}>{x.video_name || x.vid}</td>
                      <td style={{ padding: 10 }}>{fmtDate(x.updated_at || x.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                <th style={{ padding: 12, fontSize: 12, color: "#6b7280" }}>Mobile ID</th>
                <th style={{ padding: 12, fontSize: 12, color: "#6b7280" }}>Downloaded</th>
                <th style={{ padding: 12, fontSize: 12, color: "#6b7280" }}>Created</th>
                <th style={{ padding: 12, fontSize: 12, color: "#6b7280" }}>Updated</th>
                <th style={{ padding: 12, fontSize: 12, color: "#6b7280", width: 120, textAlign: "right" }}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 14, color: "#6b7280" }}>
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 14, color: "#6b7280" }}>
                    No devices found.
                  </td>
                </tr>
              ) : (
                items.map((d) => (
                  <tr key={d.id ?? d.mobile_id} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: 12, fontWeight: 800 }}>{d.mobile_id}</td>
                    <td style={{ padding: 12 }}>{d.download_status ? "Yes" : "No"}</td>
                    <td style={{ padding: 12 }}>{fmtDate(d.created_at)}</td>
                    <td style={{ padding: 12 }}>{fmtDate(d.updated_at)}</td>
                    <td style={{ padding: 12, textAlign: "right" }}>
                      <button style={btnDanger} onClick={() => onDelete(d)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {paginationBar}

        {/* Two-step Add Device Modal */}
        <Modal
          open={addOpen}
          title={step === 1 ? "Add Device - Step 1: Enter Mobile ID" : "Add Device - Step 2: Link to Group & Shop"}
          onClose={() => setAddOpen(false)}
          footer={
            step === 1 ? (
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button style={btnGhost} onClick={() => setAddOpen(false)} disabled={adding}>
                  Cancel
                </button>
                <button style={btnGhost} onClick={addDeviceOnly} disabled={!canProceedToStep2 || adding}>
                  Create Without Linking
                </button>
                <button style={btn} onClick={handleProceedToStep2} disabled={!canProceedToStep2}>
                  Next: Select Group & Shop →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button style={btnGhost} onClick={handleBack} disabled={adding}>
                  ← Back
                </button>
                <button style={btnGhost} onClick={() => setAddOpen(false)} disabled={adding}>
                  Cancel
                </button>
                <button style={btnSuccess} onClick={addDeviceWithLinking} disabled={!canSubmit || adding}>
                  {adding ? "Creating..." : "Create & Link Device"}
                </button>
              </div>
            )
          }
        >
          {errText && (
            <div
              style={{
                marginBottom: 12,
                padding: 10,
                borderRadius: 10,
                background: "#fef2f2",
                color: "#991b1b",
                border: "1px solid #fecaca",
              }}
            >
              {errText}
            </div>
          )}

          {success && (
            <div
              style={{
                marginBottom: 12,
                padding: 10,
                borderRadius: 10,
                background: "#ecfdf5",
                color: "#065f46",
                border: "1px solid #a7f3d0",
              }}
            >
              {success}
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Mobile ID *</div>
                <input
                  value={mobileId}
                  onChange={(e) => setMobileId(e.target.value)}
                  placeholder="e.g. c5c64c89008c530e"
                  style={inputStyle}
                  autoFocus
                />
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                  This is the Android device ID. You can find it in the device settings or from the app.
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
                <input type="checkbox" checked={downloaded} onChange={(e) => setDownloaded(e.target.checked)} />
                Mark as downloaded (videos already on device)
              </label>

              <div style={{ padding: 12, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Workflow:</div>
                <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#4b5563" }}>
                  <li>Enter the Mobile ID first</li>
                  <li>Select Group and Shop to link the device</li>
                  <li>Videos from the group will be automatically assigned</li>
                </ol>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ padding: 12, background: "#eef2ff", borderRadius: 8, border: "1px solid #c7d2fe" }}>
                <strong>Device:</strong> {mobileId}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Group *</div>
                  <select
                    style={inputStyle}
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    disabled={loadingLists}
                  >
                    <option value="">-- Select Group --</option>
                    {groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Videos are linked to groups</div>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Shop *</div>
                  <select
                    style={inputStyle}
                    value={shop}
                    onChange={(e) => setShop(e.target.value)}
                    disabled={loadingLists}
                  >
                    <option value="">-- Select Shop --</option>
                    {shops.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Location where device is installed</div>
                </div>
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  padding: 12,
                  background: "#fffbeb",
                  borderRadius: 8,
                  border: "1px solid #fde68a",
                }}
              >
                <strong>Note:</strong> The device will automatically receive all videos assigned to the selected group.
                You can change the video assignments in the "Group Linked Video" section.
              </div>
            </div>
          )}
        </Modal>
      </Modal>
    </div>
  );
}

