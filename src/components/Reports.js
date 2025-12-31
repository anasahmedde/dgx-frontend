// src/components/Reports.js
// Updated with 24hr temperature graph
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

// DVSG API runs on port 8005
const DVSG_BASE = process.env.REACT_APP_API_BASE_URL || 
  `${window.location.protocol}//${window.location.hostname}:8005`;

const api = axios.create({
  baseURL: DVSG_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

function Modal({ open, title, onClose, children, footer, width = "720px" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: open ? "grid" : "none", placeItems: "center", zIndex: 2000 };
  const card = { width: `min(92vw, ${width})`, background: "#fff", borderRadius: 14, boxShadow: "0 20px 50px rgba(0,0,0,.2)", overflow: "hidden" };
  const header = { padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 600 };
  const body = { padding: 16, maxHeight: "80vh", overflowY: "auto" };
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

// Simple temperature chart component (SVG-based, no external library needed)
function TemperatureChart({ data, timeRange }) {
  const chartHeight = 300;
  const chartWidth = 800;
  const padding = { top: 20, right: 30, bottom: 50, left: 60 };
  
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Process data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data
      .filter(d => d.log_type === 'temperature' && d.value != null)
      .map(d => ({
        time: new Date(d.logged_at),
        value: parseFloat(d.value),
      }))
      .sort((a, b) => a.time - b.time);
  }, [data]);

  if (processedData.length === 0) {
    return (
      <div style={{ 
        height: chartHeight, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#f8fafc",
        borderRadius: 8,
        color: "#6b7280",
      }}>
        No temperature data available for the selected period
      </div>
    );
  }

  // Calculate scales
  const minTemp = Math.floor(Math.min(...processedData.map(d => d.value)) - 2);
  const maxTemp = Math.ceil(Math.max(...processedData.map(d => d.value)) + 2);
  const minTime = processedData[0].time.getTime();
  const maxTime = processedData[processedData.length - 1].time.getTime();
  const timeSpan = maxTime - minTime || 1;
  const tempSpan = maxTemp - minTemp || 1;

  // Generate path
  const points = processedData.map((d, i) => {
    const x = padding.left + ((d.time.getTime() - minTime) / timeSpan) * innerWidth;
    const y = padding.top + innerHeight - ((d.value - minTemp) / tempSpan) * innerHeight;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate area path
  const areaPoints = processedData.map((d, i) => {
    const x = padding.left + ((d.time.getTime() - minTime) / timeSpan) * innerWidth;
    const y = padding.top + innerHeight - ((d.value - minTemp) / tempSpan) * innerHeight;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  const firstX = padding.left + ((processedData[0].time.getTime() - minTime) / timeSpan) * innerWidth;
  const lastX = padding.left + ((processedData[processedData.length - 1].time.getTime() - minTime) / timeSpan) * innerWidth;
  const bottomY = padding.top + innerHeight;
  const areaPath = `${areaPoints} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

  // Y-axis ticks
  const yTicks = [];
  const yStep = tempSpan <= 10 ? 1 : Math.ceil(tempSpan / 5);
  for (let t = minTemp; t <= maxTemp; t += yStep) {
    const y = padding.top + innerHeight - ((t - minTemp) / tempSpan) * innerHeight;
    yTicks.push({ value: t, y });
  }

  // X-axis ticks
  const xTicks = [];
  const numXTicks = 6;
  for (let i = 0; i <= numXTicks; i++) {
    const time = new Date(minTime + (timeSpan * i / numXTicks));
    const x = padding.left + (innerWidth * i / numXTicks);
    xTicks.push({ time, x });
  }

  // Format time based on time range
  const formatTime = (date) => {
    if (timeRange === '1h' || timeRange === '6h' || timeRange === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Calculate statistics
  const avgTemp = processedData.reduce((sum, d) => sum + d.value, 0) / processedData.length;
  const currentTemp = processedData[processedData.length - 1].value;

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ padding: "10px 16px", background: "#dbeafe", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: "#1e40af" }}>Current</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1e40af" }}>{currentTemp.toFixed(1)}°C</div>
        </div>
        <div style={{ padding: "10px 16px", background: "#dcfce7", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: "#166534" }}>Average</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#166534" }}>{avgTemp.toFixed(1)}°C</div>
        </div>
        <div style={{ padding: "10px 16px", background: "#fef3c7", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: "#92400e" }}>Min</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#92400e" }}>{Math.min(...processedData.map(d => d.value)).toFixed(1)}°C</div>
        </div>
        <div style={{ padding: "10px 16px", background: "#fee2e2", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: "#991b1b" }}>Max</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#991b1b" }}>{Math.max(...processedData.map(d => d.value)).toFixed(1)}°C</div>
        </div>
        <div style={{ padding: "10px 16px", background: "#f3e8ff", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: "#7c3aed" }}>Data Points</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#7c3aed" }}>{processedData.length}</div>
        </div>
      </div>

      {/* Chart */}
      <svg width={chartWidth} height={chartHeight} style={{ background: "#fafafa", borderRadius: 8, maxWidth: "100%" }}>
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={`grid-${i}`}
            x1={padding.left}
            x2={chartWidth - padding.right}
            y1={tick.y}
            y2={tick.y}
            stroke="#e5e7eb"
            strokeDasharray="4,4"
          />
        ))}

        {/* Area */}
        <path d={areaPath} fill="url(#tempGradient)" opacity={0.3} />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="tempGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Line */}
        <path d={points} fill="none" stroke="#3b82f6" strokeWidth={2} />

        {/* Data points */}
        {processedData.length <= 50 && processedData.map((d, i) => {
          const x = padding.left + ((d.time.getTime() - minTime) / timeSpan) * innerWidth;
          const y = padding.top + innerHeight - ((d.value - minTemp) / tempSpan) * innerHeight;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3}
              fill="#3b82f6"
              stroke="#fff"
              strokeWidth={1}
            />
          );
        })}

        {/* Y-axis */}
        <line x1={padding.left} x2={padding.left} y1={padding.top} y2={padding.top + innerHeight} stroke="#94a3b8" />
        {yTicks.map((tick, i) => (
          <g key={`y-${i}`}>
            <line x1={padding.left - 5} x2={padding.left} y1={tick.y} y2={tick.y} stroke="#94a3b8" />
            <text x={padding.left - 10} y={tick.y + 4} textAnchor="end" fontSize={11} fill="#64748b">
              {tick.value}°
            </text>
          </g>
        ))}
        <text
          x={20}
          y={padding.top + innerHeight / 2}
          textAnchor="middle"
          fontSize={12}
          fill="#64748b"
          transform={`rotate(-90, 20, ${padding.top + innerHeight / 2})`}
        >
          Temperature (°C)
        </text>

        {/* X-axis */}
        <line x1={padding.left} x2={chartWidth - padding.right} y1={padding.top + innerHeight} y2={padding.top + innerHeight} stroke="#94a3b8" />
        {xTicks.map((tick, i) => (
          <g key={`x-${i}`}>
            <line x1={tick.x} x2={tick.x} y1={padding.top + innerHeight} y2={padding.top + innerHeight + 5} stroke="#94a3b8" />
            <text x={tick.x} y={padding.top + innerHeight + 20} textAnchor="middle" fontSize={10} fill="#64748b">
              {formatTime(tick.time)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function formatDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

export default function Reports() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Device logs modal
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceLogs, setDeviceLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logType, setLogType] = useState("");

  // Temperature chart modal
  const [tempChartDevice, setTempChartDevice] = useState(null);
  const [tempChartData, setTempChartData] = useState([]);
  const [loadingTempChart, setLoadingTempChart] = useState(false);
  const [timeRange, setTimeRange] = useState("24h");

  const loadSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const res = await api.get("/devices/logs/summary", { params });
      setSummary(res.data?.items || []);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  const downloadSummary = () => {
    let url = `${DVSG_BASE}/devices/logs/summary/download`;
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (params.toString()) url += `?${params.toString()}`;
    window.open(url, "_blank");
  };

  const loadDeviceLogs = async (mobileId) => {
    setSelectedDevice(mobileId);
    setLoadingLogs(true);
    try {
      const params = { limit: 500 };
      if (logType) params.log_type = logType;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const res = await api.get(`/device/${mobileId}/logs`, { params });
      setDeviceLogs(res.data?.items || []);
    } catch (e) {
      console.error("Failed to load logs:", e);
      setDeviceLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const downloadDeviceLogs = (mobileId) => {
    let url = `${DVSG_BASE}/device/${mobileId}/logs/download`;
    const params = new URLSearchParams();
    if (logType) params.append("log_type", logType);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (params.toString()) url += `?${params.toString()}`;
    window.open(url, "_blank");
  };

  // Load temperature chart data
  const loadTempChartData = async (mobileId, range) => {
    setTempChartDevice(mobileId);
    setTimeRange(range);
    setLoadingTempChart(true);
    
    try {
      const now = new Date();
      let startTime = new Date();
      
      switch (range) {
        case "1h":
          startTime.setHours(now.getHours() - 1);
          break;
        case "6h":
          startTime.setHours(now.getHours() - 6);
          break;
        case "24h":
          startTime.setDate(now.getDate() - 1);
          break;
        case "7d":
          startTime.setDate(now.getDate() - 7);
          break;
        case "30d":
          startTime.setDate(now.getDate() - 30);
          break;
        default:
          startTime.setDate(now.getDate() - 1);
      }
      
      const params = {
        log_type: "temperature",
        start_date: startTime.toISOString().split('T')[0],
        end_date: now.toISOString().split('T')[0],
        limit: 5000,
      };
      
      const res = await api.get(`/device/${mobileId}/logs`, { params });
      setTempChartData(res.data?.items || []);
    } catch (e) {
      console.error("Failed to load temperature data:", e);
      setTempChartData([]);
    } finally {
      setLoadingTempChart(false);
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const input = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 14 };
  const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 };
  const btnPrimary = { ...btn, background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" };
  const btnSuccess = { ...btn, background: "#10b981", color: "#fff", borderColor: "#10b981" };
  const btnWarning = { ...btn, background: "#f59e0b", color: "#fff", borderColor: "#f59e0b" };

  return (
    <div>
      <h2 style={{ fontSize: 28, margin: "0 0 12px" }}>Reports & Logs</h2>
      
      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Start Date</div>
          <input
            type="date"
            style={input}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>End Date</div>
          <input
            type="date"
            style={input}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button style={btnPrimary} onClick={loadSummary} disabled={loading}>
          {loading ? "Loading..." : "Apply Filters"}
        </button>
        <button style={btnSuccess} onClick={downloadSummary}>
          📥 Download All Summary (CSV)
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      {/* Summary Table */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>Device ID</th>
              <th style={{ textAlign: "center", padding: 12, borderBottom: "1px solid #eee" }}>Door Opens</th>
              <th style={{ textAlign: "center", padding: 12, borderBottom: "1px solid #eee" }}>Avg Temp (°C)</th>
              <th style={{ textAlign: "center", padding: 12, borderBottom: "1px solid #eee" }}>Min/Max Temp</th>
              <th style={{ textAlign: "right", padding: 12, borderBottom: "1px solid #eee" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {summary.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
                  {loading ? "Loading..." : "No data found"}
                </td>
              </tr>
            )}
            {summary.map((row) => (
              <tr key={row.mobile_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: 12, fontFamily: "monospace" }}>{row.mobile_id}</td>
                <td style={{ padding: 12, textAlign: "center" }}>
                  <span style={{ 
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 20,
                    background: row.door_open_count > 0 ? "#dbeafe" : "#f3f4f6",
                    color: row.door_open_count > 0 ? "#1e40af" : "#6b7280",
                    fontWeight: 600,
                  }}>
                    {row.door_open_count || 0}
                  </span>
                </td>
                <td style={{ padding: 12, textAlign: "center" }}>
                  {row.avg_temperature !== null ? `${row.avg_temperature}°C` : "-"}
                </td>
                <td style={{ padding: 12, textAlign: "center", fontSize: 13 }}>
                  {row.min_temperature !== null && row.max_temperature !== null
                    ? `${row.min_temperature}°C / ${row.max_temperature}°C`
                    : "-"}
                </td>
                <td style={{ padding: 12, textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <button
                      style={{ ...btnWarning, padding: "4px 10px" }}
                      onClick={() => loadTempChartData(row.mobile_id, "24h")}
                      title="View 24hr temperature chart"
                    >
                      📈 24hr Temp
                    </button>
                    <button
                      style={{ ...btn, padding: "4px 10px" }}
                      onClick={() => loadDeviceLogs(row.mobile_id)}
                    >
                      View Logs
                    </button>
                    <button
                      style={{ ...btnSuccess, padding: "4px 10px" }}
                      onClick={() => downloadDeviceLogs(row.mobile_id)}
                    >
                      📥 CSV
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Temperature Chart Modal */}
      <Modal
        open={!!tempChartDevice}
        title={`🌡️ Temperature Report: ${tempChartDevice}`}
        onClose={() => setTempChartDevice(null)}
        width="900px"
        footer={
          <button style={btn} onClick={() => setTempChartDevice(null)}>Close</button>
        }
      >
        {/* Time Range Selector */}
        <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginRight: 8, alignSelf: "center" }}>Time Range:</div>
          {[
            { value: "1h", label: "1 Hour" },
            { value: "6h", label: "6 Hours" },
            { value: "24h", label: "24 Hours" },
            { value: "7d", label: "7 Days" },
            { value: "30d", label: "30 Days" },
          ].map(opt => (
            <button
              key={opt.value}
              style={{
                ...btn,
                background: timeRange === opt.value ? "#4f46e5" : "#fff",
                color: timeRange === opt.value ? "#fff" : "#374151",
                borderColor: timeRange === opt.value ? "#4f46e5" : "#e5e7eb",
              }}
              onClick={() => loadTempChartData(tempChartDevice, opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loadingTempChart ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
            Loading temperature data...
          </div>
        ) : (
          <TemperatureChart data={tempChartData} timeRange={timeRange} />
        )}
      </Modal>

      {/* Device Logs Modal */}
      <Modal
        open={!!selectedDevice}
        title={`Logs for Device: ${selectedDevice}`}
        onClose={() => setSelectedDevice(null)}
        width="800px"
        footer={
          <>
            <button style={btn} onClick={() => setSelectedDevice(null)}>Close</button>
            <button style={btnSuccess} onClick={() => downloadDeviceLogs(selectedDevice)}>
              📥 Download CSV
            </button>
          </>
        }
      >
        <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
          <select
            style={input}
            value={logType}
            onChange={(e) => {
              setLogType(e.target.value);
              if (selectedDevice) loadDeviceLogs(selectedDevice);
            }}
          >
            <option value="">All Log Types</option>
            <option value="temperature">Temperature</option>
            <option value="door_open">Door Open</option>
          </select>
          <button style={btn} onClick={() => loadDeviceLogs(selectedDevice)} disabled={loadingLogs}>
            {loadingLogs ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", maxHeight: 400, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "#f8fafc" }}>
              <tr>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee", fontSize: 12 }}>Type</th>
                <th style={{ textAlign: "center", padding: 10, borderBottom: "1px solid #eee", fontSize: 12 }}>Value</th>
                <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #eee", fontSize: 12 }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {deviceLogs.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
                    {loadingLogs ? "Loading..." : "No logs found"}
                  </td>
                </tr>
              )}
              {deviceLogs.map((log, i) => (
                <tr key={log.id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 10 }}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: log.log_type === "temperature" ? "#fef3c7" : "#dbeafe",
                      color: log.log_type === "temperature" ? "#92400e" : "#1e40af",
                    }}>
                      {log.log_type}
                    </span>
                  </td>
                  <td style={{ padding: 10, textAlign: "center", fontFamily: "monospace" }}>
                    {log.log_type === "temperature" ? `${log.value}°C` : log.value}
                  </td>
                  <td style={{ padding: 10, textAlign: "right", fontSize: 12, color: "#6b7280" }}>
                    {formatDate(log.logged_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
