import React, { useEffect, useMemo, useState } from "react";
import { insertDevice } from "../api/device";
import { listGroups } from "../api/group";
import { listShops } from "../api/shop";
import { api } from "../api/httpFactory";

function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: open ? "grid" : "none", placeItems: "center", zIndex: 2000 };
  const card = { width: "min(92vw, 820px)", background: "#fff", borderRadius: 14, boxShadow: "0 20px 50px rgba(0,0,0,.2)", overflow: "hidden" };
  const header = { padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 600 };
  const body = { padding: 16, maxHeight: "70vh", overflowY: "auto" };
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
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  const [mobileId, setMobileId] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const [group, setGroup] = useState("");
  const [shop, setShop] = useState("");

  const [groups, setGroups] = useState([]);
  const [shops, setShops] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [listErr, setListErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const input = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 14, width: "100%" };
  const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 };
  const btnPrimary = { ...btn, background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" };
  const btnSuccess = { ...btn, background: "#10b981", color: "#fff", borderColor: "#10b981" };

  const canProceedToStep2 = useMemo(() => mobileId.trim().length > 0, [mobileId]);
  const canSubmit = useMemo(() => mobileId.trim() && group && shop, [mobileId, group, shop]);

  const loadLists = async () => {
    setLoadingLists(true);
    setListErr("");
    try {
      const [groupsRes, shopsRes] = await Promise.all([
        listGroups(100, 0),
        listShops(100, 0),
      ]);
      
      // Extract names from the items
      const groupNames = (groupsRes?.items || []).map(g => g.gname || g.name || g).filter(Boolean);
      const shopNames = (shopsRes?.items || []).map(s => s.shop_name || s.name || s).filter(Boolean);
      
      setGroups(groupNames);
      setShops(shopNames);
      
      if (!group && groupNames.length) setGroup(groupNames[0]);
      if (!shop && shopNames.length) setShop(shopNames[0]);
    } catch (e) {
      console.error("Error loading lists:", e);
      setListErr("Failed to load groups/shops. Please check that group and shop services are running.");
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    if (open && step === 2) loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  const handleOpenModal = () => {
    setOpen(true);
    setStep(1);
    setMobileId("");
    setDownloaded(false);
    setGroup("");
    setShop("");
    setSuccess("");
    setListErr("");
  };

  const handleProceedToStep2 = () => {
    if (canProceedToStep2) setStep(2);
  };

  const handleBack = () => setStep(1);

  const addDeviceWithLinking = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setListErr("");
    setSuccess("");

    const id = mobileId.trim();

    try {
      // Use the new /device/create endpoint on port 8005
      const response = await api.post("/device/create", {
        mobile_id: id,
        group_name: group,
        shop_name: shop,
      });

      if (response.data) {
        setSuccess(`Device ${id} created and linked successfully!`);
        setTimeout(() => {
          setMobileId("");
          setDownloaded(false);
          setStep(1);
          setOpen(false);
          setSuccess("");
        }, 1500);
      }
    } catch (e) {
      console.error("Error creating device:", e);
      // Fallback: just insert device without linking
      try {
        await insertDevice({ mobile_id: id, download_status: downloaded });
        setSuccess(`Device ${id} created! Link it to a group using the Linker.`);
        setTimeout(() => {
          setMobileId("");
          setDownloaded(false);
          setStep(1);
          setOpen(false);
          setSuccess("");
        }, 1500);
      } catch (e2) {
        setListErr(e2?.response?.data?.detail || e2?.message || "Failed to add device");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const addDeviceOnly = async () => {
    if (!mobileId.trim()) return;
    setSubmitting(true);
    setListErr("");
    setSuccess("");

    try {
      await insertDevice({ mobile_id: mobileId.trim(), download_status: downloaded });
      setSuccess(`Device ${mobileId.trim()} created! You can link it to a group later.`);
      setTimeout(() => {
        setMobileId("");
        setDownloaded(false);
        setOpen(false);
        setSuccess("");
      }, 1500);
    } catch (e) {
      setListErr(e?.response?.data?.detail || e?.message || "Failed to create device");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 28, margin: "0 0 12px" }}>Devices</h2>
        <button style={btnPrimary} onClick={handleOpenModal}>+ Add Device</button>
      </div>

      <Modal
        open={open}
        title={step === 1 ? "Add Device - Step 1: Enter Mobile ID" : "Add Device - Step 2: Link to Group & Shop"}
        onClose={() => setOpen(false)}
        footer={
          step === 1 ? (
            <>
              <button style={btn} onClick={() => setOpen(false)}>Cancel</button>
              <button style={btn} onClick={addDeviceOnly} disabled={!canProceedToStep2 || submitting}>
                Create Without Linking
              </button>
              <button style={btnPrimary} onClick={handleProceedToStep2} disabled={!canProceedToStep2}>
                Next: Select Group & Shop →
              </button>
            </>
          ) : (
            <>
              <button style={btn} onClick={handleBack} disabled={submitting}>← Back</button>
              <button style={btn} onClick={() => setOpen(false)} disabled={submitting}>Cancel</button>
              <button style={btnSuccess} disabled={!canSubmit || submitting} onClick={addDeviceWithLinking}>
                {submitting ? "Creating..." : "Create & Link Device"}
              </button>
            </>
          )
        }
      >
        {listErr && (
          <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
            {listErr}
          </div>
        )}
        
        {success && (
          <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" }}>
            {success}
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Mobile ID *</div>
              <input
                style={input}
                placeholder="e.g. c5c64c89008c530e"
                value={mobileId}
                onChange={(e) => setMobileId(e.target.value)}
                autoFocus
              />
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                This is the Android device ID. You can find it in the device settings or from the app.
              </div>
            </div>
            
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <input type="checkbox" checked={downloaded} onChange={(e) => setDownloaded(e.target.checked)} />
                Mark as downloaded (videos already on device)
              </label>
            </div>

            <div style={{ marginTop: 16, padding: 12, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
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
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: "#eef2ff", borderRadius: 8, border: "1px solid #c7d2fe" }}>
              <strong>Device:</strong> {mobileId}
            </div>

            {loadingLists && <div style={{ padding: 20, textAlign: "center" }}>Loading groups and shops...</div>}

            {!loadingLists && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Group *</div>
                  <select style={input} value={group} onChange={(e) => setGroup(e.target.value)}>
                    <option value="">-- Select Group --</option>
                    {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                    Videos are linked to groups
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Shop *</div>
                  <select style={input} value={shop} onChange={(e) => setShop(e.target.value)}>
                    <option value="">-- Select Shop --</option>
                    {shops.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                    Location where device is installed
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 13, color: "#6b7280" }}>
              <strong>Note:</strong> The device will automatically receive all videos assigned to the selected group.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
