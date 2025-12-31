// src/components/Device.js
// Device Management with server-side pagination and temperature line graph reports
// Updated with Report button for each device listing
import React, { useEffect, useMemo, useState, useCallback } from "react";
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

// ===== Temperature Line Graph Component =====
function TemperatureLineGraph({ data, timeRange, title, onDownload }) {
  const chartHeight = 320;
  const chartWidth = 750;
  const padding = { top: 30, right: 40, bottom: 60, left: 70 };

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Process data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter((d) => d.log_type === "temperature" && d.value != null)
      .map((d) => ({
        time: new Date(d.logged_at),
        value: parseFloat(d.value),
      }))
      .sort((a, b) => a.time - b.time);
  }, [data]);

  if (processedData.length === 0) {
    return (
      <div
        style={{
          height: chartHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          borderRadius: 8,
          color: "#6b7280",
        }}
      >
        No temperature data available for the selected period
      </div>
    );
  }

  // Calculate scales
  const minTemp = Math.floor(Math.min(...processedData.map((d) => d.value)) - 2);
  const maxTemp = Math.ceil(Math.max(...processedData.map((d) => d.value)) + 2);
  const minTime = processedData[0].time.getTime();
  const maxTime = processedData[processedData.length - 1].time.getTime();
  const timeSpan = maxTime - minTime || 1;
  const tempSpan = maxTemp - minTemp || 1;

  // Generate line path
  const linePath = processedData
    .map((d, i) => {
      const x = padding.left + ((d.time.getTime() - minTime) / timeSpan) * innerWidth;
      const y = padding.top + innerHeight - ((d.value - minTemp) / tempSpan) * innerHeight;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Generate area path for gradient fill
  const firstX = padding.left + ((processedData[0].time.getTime() - minTime) / timeSpan) * innerWidth;
  const lastX = padding.left + ((processedData[processedData.length - 1].time.getTime() - minTime) / timeSpan) * innerWidth;
  const bottomY = padding.top + innerHeight;
  const areaPath = `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

  // Y-axis ticks
  const yTicks = [];
  const yStep = tempSpan <= 10 ? 1 : Math.ceil(tempSpan / 6);
  for (let t = minTemp; t <= maxTemp; t += yStep) {
    const y = padding.top + innerHeight - ((t - minTemp) / tempSpan) * innerHeight;
    yTicks.push({ value: t, y });
  }

  // X-axis ticks
  const xTicks = [];
  const numXTicks = 6;
  for (let i = 0; i <= numXTicks; i++) {
    const time = new Date(minTime + (timeSpan * i) / numXTicks);
    const x = padding.left + (innerWidth * i) / numXTicks;
    xTicks.push({ time, x });
  }

  // Format time based on time range
  const formatTime = (date) => {
    if (timeRange === "1h" || timeRange === "6h" || timeRange === "24h") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Statistics
  const avgTemp = processedData.reduce((sum, d) => sum + d.value, 0) / processedData.length;
  const minTempVal = Math.min(...processedData.map((d) => d.value));
  const maxTempVal = Math.max(...processedData.map((d) => d.value));
  const currentTemp = processedData[processedData.length - 1].value;

  return (
    <div>
      {/* Title */}
      {title && (
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#1f2937" }}>{title}</div>
      )}

      {/* Stats Cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ padding: "10px 16px", background: "#dbeafe", borderRadius: 8, minWidth: 90 }}>
          <div style={{ fontSize: 11, color: "#1e40af", fontWeight: 600 }}>Current</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1e40af" }}>{currentTemp.toFixed(1)}°C</div>
        </div>
        <div style={{ padding: "10px 16px", background: "#dcfce7", borderRadius: 8, minWidth: 90 }}>
          <div style={{ fontSize: 11, color: "#166534", fontWeight: 600 }}>Average</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#166534" }}>{avgTemp.toFixed(1)}°C</div>
        </div>
        <div style={{ padding: "10px 16px", background: "#fef3c7", borderRadius: 8, minWidth: 90 }}>
          <div style={{ fontSize: 11, color: "#92400e", fontWeight: 600 }}>Min</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#92400e" }}>{minTempVal.toFixed(1)}°C</div>
        </div>
        <div style={{ padding: "10px 16px", background: "#fee2e2", borderRadius: 8, minWidth: 90 }}>
          <div style={{ fontSize: 11, color: "#991b1b", fontWeight: 600 }}>Max</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#991b1b" }}>{maxTempVal.toFixed(1)}°C</div>
        </div>
        <div style={{ padding: "10px 16px", background: "#f3e8ff", borderRadius: 8, minWidth: 90 }}>
          <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600 }}>Points</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#7c3aed" }}>{processedData.length}</div>
        </div>
      </div>

      {/* SVG Line Chart */}
      <svg
        width={chartWidth}
        height={chartHeight}
        style={{ background: "#fafafa", borderRadius: 8, maxWidth: "100%", display: "block" }}
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="tempGradientLine" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={`grid-y-${i}`}
            x1={padding.left}
            x2={chartWidth - padding.right}
            y1={tick.y}
            y2={tick.y}
            stroke="#e5e7eb"
            strokeDasharray="4,4"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#tempGradientLine)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points (only show if not too many) */}
        {processedData.length <= 50 &&
          processedData.map((d, i) => {
            const x = padding.left + ((d.time.getTime() - minTime) / timeSpan) * innerWidth;
            const y = padding.top + innerHeight - ((d.value - minTemp) / tempSpan) * innerHeight;
            return <circle key={i} cx={x} cy={y} r={3} fill="#3b82f6" stroke="#fff" strokeWidth={1.5} />;
          })}

        {/* Y-axis */}
        <line x1={padding.left} x2={padding.left} y1={padding.top} y2={padding.top + innerHeight} stroke="#9ca3af" />
        {yTicks.map((tick, i) => (
          <g key={`y-tick-${i}`}>
            <line x1={padding.left - 5} x2={padding.left} y1={tick.y} y2={tick.y} stroke="#9ca3af" />
            <text x={padding.left - 10} y={tick.y + 4} textAnchor="end" fontSize={11} fill="#6b7280">
              {tick.value}°C
            </text>
          </g>
        ))}

        {/* X-axis */}
        <line
          x1={padding.left}
          x2={chartWidth - padding.right}
          y1={padding.top + innerHeight}
          y2={padding.top + innerHeight}
          stroke="#9ca3af"
        />
        {xTicks.map((tick, i) => (
          <g key={`x-tick-${i}`}>
            <line x1={tick.x} x2={tick.x} y1={padding.top + innerHeight} y2={padding.top + innerHeight + 5} stroke="#9ca3af" />
            <text
              x={tick.x}
              y={padding.top + innerHeight + 20}
              textAnchor="middle"
              fontSize={10}
              fill="#6b7280"
              transform={`rotate(-30, ${tick.x}, ${padding.top + innerHeight + 20})`}
            >
              {formatTime(tick.time)}
            </text>
          </g>
        ))}

        {/* Axis Labels */}
        <text 
          x={padding.left / 2} 
          y={chartHeight / 2} 
          textAnchor="middle" 
          fontSize={12} 
          fill="#374151" 
          transform={`rotate(-90, ${padding.left / 2}, ${chartHeight / 2})`}
        >
          Temperature (°C)
        </text>
        <text x={chartWidth / 2} y={chartHeight - 5} textAnchor="middle" fontSize={12} fill="#374151">
          Time
        </text>
      </svg>

      {/* Download Buttons */}
      {onDownload && (
        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #3b82f6",
              background: "#3b82f6",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
            onClick={() => onDownload("absolute")}
          >
            📥 Download CSV (Absolute Values)
          </button>
          <button
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #8b5cf6",
              background: "#8b5cf6",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
            onClick={() => onDownload("relative")}
          >
            📥 Download CSV (Relative to Average)
          </button>
        </div>
      )}
    </div>
  );
}

// ===== Modal Component =====
function Modal({ open, title, onClose, children, footer, width = "980px" }) {
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
    width: `min(92vw, ${width})`,
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 20px 60px rgba(0,0,0,.25)",
    overflow: "hidden",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
  };

  const header = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    color: "white",
    background: "linear-gradient(90deg, #5b7cfa, #7c4bc9)",
    flexShrink: 0,
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
        <div style={{ padding: 14, overflowY: "auto", flex: 1 }}>{children}</div>
        {footer ? <div style={{ padding: 14, borderTop: "1px solid #e5e7eb", flexShrink: 0 }}>{footer}</div> : null}
      </div>
    </div>
  );
}

// ===== Helper Functions =====
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

// ===== Styles =====
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
  padding: "6px 10px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
  background: "#ef4444",
  color: "white",
  fontSize: 12,
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

const btnReport = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #8b5cf6",
  background: "#f5f3ff",
  color: "#7c3aed",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 11,
};

// ===== Main Component =====
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
  const [step, setStep] = useState(1);

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

  // Line Graph Report Modal State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDevice, setReportDevice] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportTimeRange, setReportTimeRange] = useState("24h");

  const canProceedToStep2 = useMemo(() => (mobileId ?? "").trim().length > 0, [mobileId]);
  const canSubmit = useMemo(() => mobileId.trim() && group && shop, [mobileId, group, shop]);

  // Load groups and shops for step 2
  const loadLists = useCallback(async () => {
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
  }, [group, shop]);

  useEffect(() => {
    if (addOpen && step === 2) loadLists();
  }, [addOpen, step, loadLists]);

  // Load page data
  const loadPage = useCallback(async (p = 1, ps = 10, qx = "") => {
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
  }, []);

  // Load temperature report data
  const loadReportData = useCallback(async (mobileIdVal, timeRangeVal) => {
    setReportLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      let startDate;
      switch (timeRangeVal) {
        case "1h":
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case "6h":
          startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const res = await dvsgApi.get(`/device/${mobileIdVal}/logs`, {
        params: {
          log_type: "temperature",
          start_date: startDate.toISOString().split("T")[0],
          end_date: now.toISOString().split("T")[0],
          limit: 5000,
        },
      });
      setReportData(res.data?.items || []);
    } catch (e) {
      console.error("Failed to load report data", e);
      setReportData([]);
    } finally {
      setReportLoading(false);
    }
  }, []);

  // Download report as CSV
  const downloadReport = useCallback(
    (mode) => {
      if (!reportData || reportData.length === 0) return;

      const tempData = reportData
        .filter((d) => d.log_type === "temperature" && d.value != null)
        .map((d) => ({
          time: new Date(d.logged_at),
          value: parseFloat(d.value),
        }))
        .sort((a, b) => a.time - b.time);

      if (tempData.length === 0) return;

      let csvContent = "";
      const avgTemp = tempData.reduce((sum, d) => sum + d.value, 0) / tempData.length;

      if (mode === "absolute") {
        csvContent = "Timestamp,Temperature (°C)\n";
        tempData.forEach((d) => {
          csvContent += `${d.time.toISOString()},${d.value.toFixed(2)}\n`;
        });
      } else {
        // Relative to average
        csvContent = "Timestamp,Temperature (°C),Deviation from Avg (°C),Deviation (%)\n";
        tempData.forEach((d) => {
          const deviation = d.value - avgTemp;
          const deviationPct = ((deviation / avgTemp) * 100).toFixed(2);
          csvContent += `${d.time.toISOString()},${d.value.toFixed(2)},${deviation.toFixed(2)},${deviationPct}\n`;
        });
      }

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `temperature_report_${reportDevice}_${reportTimeRange}_${mode}.csv`;
      link.click();
    },
    [reportData, reportDevice, reportTimeRange]
  );

  // Open report modal
  const openReport = useCallback(
    (device) => {
      setReportDevice(device.mobile_id);
      setReportTimeRange("24h");
      setReportOpen(true);
      loadReportData(device.mobile_id, "24h");
    },
    [loadReportData]
  );

  // Change time range
  const changeTimeRange = useCallback(
    (range) => {
      setReportTimeRange(range);
      if (reportDevice) {
        loadReportData(reportDevice, range);
      }
    },
    [reportDevice, loadReportData]
  );

  // initial load + reload when page/pageSize changes (only when modal open)
  useEffect(() => {
    if (!open) return;
    loadPage(page, pageSize, qApplied);
  }, [open, page, pageSize, qApplied, loadPage]);

  const onSearch = async () => {
    const nextQ = (q || "").trim();
    setQApplied(nextQ);
    setPage(1);
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
                <th style={{ padding: 12, fontSize: 12, color: "#6b7280", width: 180, textAlign: "right" }}>
                  Actions
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
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button style={btnReport} onClick={() => openReport(d)} title="View Temperature Report">
                          📈 Report
                        </button>
                        <button style={btnDanger} onClick={() => onDelete(d)}>
                          Delete
                        </button>
                      </div>
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
          width="600px"
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

        {/* Temperature Report Modal */}
        <Modal
          open={reportOpen}
          title={`📈 Temperature Report: ${reportDevice}`}
          onClose={() => setReportOpen(false)}
          width="900px"
          footer={
            <button style={btnGhost} onClick={() => setReportOpen(false)}>
              Close
            </button>
          }
        >
          {/* Time Range Selector */}
          <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginRight: 8 }}>Time Range:</div>
            {[
              { value: "1h", label: "1 Hour" },
              { value: "6h", label: "6 Hours" },
              { value: "24h", label: "24 Hours" },
              { value: "7d", label: "7 Days" },
              { value: "30d", label: "30 Days" },
            ].map((opt) => (
              <button
                key={opt.value}
                style={{
                  ...btnTiny,
                  background: reportTimeRange === opt.value ? "#4f46e5" : "#fff",
                  color: reportTimeRange === opt.value ? "#fff" : "#374151",
                  borderColor: reportTimeRange === opt.value ? "#4f46e5" : "#e5e7eb",
                }}
                onClick={() => changeTimeRange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {reportLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading temperature data...</div>
          ) : (
            <TemperatureLineGraph
              data={reportData}
              timeRange={reportTimeRange}
              title={`Temperature History (${reportTimeRange})`}
              onDownload={downloadReport}
            />
          )}
        </Modal>
      </Modal>
    </div>
  );
}
