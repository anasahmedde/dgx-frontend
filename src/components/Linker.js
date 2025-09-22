// src/components/Linker.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { listDevices } from "../api/device";
import { listGroups } from "../api/group";
import { listShops } from "../api/shop";
import { listVideos } from "../api/video";
import { createLink } from "../api/link";

// MUI
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";

/** simple debounce hook */
function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Linker() {
  // selected values (what you will POST)
  const [mobileId, setMobileId] = useState("");
  const [gname, setGname] = useState("");
  const [shopName, setShopName] = useState("");
  const [videoName, setVideoName] = useState("");

  // input text in each autocomplete
  const [mobileIdInput, setMobileIdInput] = useState("");
  const [gnameInput, setGnameInput] = useState("");
  const [shopNameInput, setShopNameInput] = useState("");
  const [videoNameInput, setVideoNameInput] = useState("");

  // debounced input (to avoid spamming API)
  const dMobile = useDebouncedValue(mobileIdInput, 300);
  const dGroup = useDebouncedValue(gnameInput, 300);
  const dShop = useDebouncedValue(shopNameInput, 300);
  const dVideo = useDebouncedValue(videoNameInput, 300);

  // option lists (strings)
  const [deviceOpts, setDeviceOpts] = useState([]);
  const [groupOpts, setGroupOpts] = useState([]);
  const [shopOpts, setShopOpts] = useState([]);
  const [videoOpts, setVideoOpts] = useState([]);

  // loading flags per field
  const [loadingDevice, setLoadingDevice] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [loadingShop, setLoadingShop] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);

  // global UI
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // cache last queries to avoid duplicate in-flight
  const lastQ = useRef({ device: null, group: null, shop: null, video: null });

  // initial load of defaults (top items)
  useEffect(() => {
    reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeMap = (arr, key) => (arr || []).map((x) => (typeof x === "string" ? x : x?.[key])).filter(Boolean);

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

  const reloadAll = async () => {
    setBusy(true);
    setMsg("");
    try {
      const MAX = 50; // default slice for initial options
      const [d, g, s, v] = await Promise.all([
        listDevices({ limit: MAX, offset: 0 }).then((r) => r.data.items || []),
        withLimitFallback(listGroups, { limit: MAX, offset: 0 }),
        withLimitFallback(listShops, { limit: MAX, offset: 0 }),
        withLimitFallback(listVideos, { limit: MAX, offset: 0 }),
      ]);
      setDeviceOpts(safeMap(d, "mobile_id"));
      setGroupOpts(safeMap(g, "gname"));
      setShopOpts(safeMap(s, "shop_name"));
      setVideoOpts(safeMap(v, "video_name"));
    } catch (e) {
      setMsg(`Failed to load lists: ${e?.response?.data?.detail || e.message}`);
    } finally {
      setBusy(false);
    }
  };

  // === server-side filtering per field (debounced) ===
  useEffect(() => {
    const q = dMobile?.trim() || "";
    if (q === lastQ.current.device) return;
    lastQ.current.device = q;
    setLoadingDevice(true);
    listDevices({ q, limit: 50, offset: 0 })
      .then((r) => setDeviceOpts(safeMap(r.data.items || [], "mobile_id")))
      .catch(() => {}) // keep prior opts on error
      .finally(() => setLoadingDevice(false));
  }, [dMobile]);

  useEffect(() => {
    const q = dGroup?.trim() || "";
    if (q === lastQ.current.group) return;
    lastQ.current.group = q;
    setLoadingGroup(true);
    listGroups({ q, limit: 50, offset: 0 })
      .then((r) => setGroupOpts(safeMap(r.data.items || [], "gname")))
      .catch(() => {})
      .finally(() => setLoadingGroup(false));
  }, [dGroup]);

  useEffect(() => {
    const q = dShop?.trim() || "";
    if (q === lastQ.current.shop) return;
    lastQ.current.shop = q;
    setLoadingShop(true);
    listShops({ q, limit: 50, offset: 0 })
      .then((r) => setShopOpts(safeMap(r.data.items || [], "shop_name")))
      .catch(() => {})
      .finally(() => setLoadingShop(false));
  }, [dShop]);

  useEffect(() => {
    const q = dVideo?.trim() || "";
    if (q === lastQ.current.video) return;
    lastQ.current.video = q;
    setLoadingVideo(true);
    listVideos({ q, limit: 50, offset: 0 })
      .then((r) => setVideoOpts(safeMap(r.data.items || [], "video_name")))
      .catch(() => {})
      .finally(() => setLoadingVideo(false));
  }, [dVideo]);

  const clear = () => {
    setMobileId("");
    setGname("");
    setShopName("");
    setVideoName("");
    setMobileIdInput("");
    setGnameInput("");
    setShopNameInput("");
    setVideoNameInput("");
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
    } catch (e) {
      setMsg(`Failed: ${e?.response?.data?.detail || e.message}`);
    } finally {
      setBusy(false);
    }
  };

  // styles
  const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 };
  const btnPrimary = { ...btn, background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" };
  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

  // Disable MUI local filtering; we rely on server ?q=
  const passthroughFilter = (x) => x;

  return (
    <div style={{ background: "#fff" }}>
      <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>
        Create Relation (Device • Group • Shop • Video)
      </h2>

      <div style={grid2}>
        {/* Device (mobile_id) */}
        <Autocomplete
          size="small"
          options={deviceOpts}
          value={mobileId || null}
          inputValue={mobileIdInput}
          onInputChange={(_, v) => setMobileIdInput(v)}
          onChange={(_, v) => setMobileId(v || "")}
          filterOptions={passthroughFilter}
          loading={loadingDevice}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Device (mobile_id)"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingDevice ? <CircularProgress color="inherit" size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {/* Group (gname) */}
        <Autocomplete
          size="small"
          options={groupOpts}
          value={gname || null}
          inputValue={gnameInput}
          onInputChange={(_, v) => setGnameInput(v)}
          onChange={(_, v) => setGname(v || "")}
          filterOptions={passthroughFilter}
          loading={loadingGroup}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Group (gname)"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingGroup ? <CircularProgress color="inherit" size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {/* Shop (shop_name) */}
        <Autocomplete
          size="small"
          options={shopOpts}
          value={shopName || null}
          inputValue={shopNameInput}
          onInputChange={(_, v) => setShopNameInput(v)}
          onChange={(_, v) => setShopName(v || "")}
          filterOptions={passthroughFilter}
          loading={loadingShop}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Shop (shop_name)"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingShop ? <CircularProgress color="inherit" size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {/* Video (video_name) */}
        <Autocomplete
          size="small"
          options={videoOpts}
          value={videoName || null}
          inputValue={videoNameInput}
          onInputChange={(_, v) => setVideoNameInput(v)}
          onChange={(_, v) => setVideoName(v || "")}
          filterOptions={passthroughFilter}
          loading={loadingVideo}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Video (video_name)"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingVideo ? <CircularProgress color="inherit" size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
        <button style={btn} onClick={reloadAll} disabled={busy}>Reload lists</button>
        <button style={btnPrimary} onClick={add} disabled={busy}>Create Link</button>
        {msg && (
          <span
            style={{
              marginLeft: 8,
              color: msg.startsWith("Failed") ? "#dc2626" : "#16a34a",
              fontSize: 13,
            }}
          >
            {busy ? "Working…" : msg}
          </span>
        )}
      </div>
    </div>
  );
}

