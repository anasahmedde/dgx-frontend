4 }}>End Date</div>
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
                  <button
                    style={{ ...btn, padding: "4px 10px", marginRight: 4 }}
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Device Logs Modal */}
      <Modal
        open={!!selectedDevice}
        title={`Logs for Device: ${selectedDevice}`}
        onClose={() => setSelectedDevice(null)}
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
          <button style={btn} onClick={() => loadDeviceLogs(selectedDevice)}>
            Refresh
          </button>
        </div>

        {loadingLogs ? (
          <div style={{ textAlign: "center", padding: 20, color: "#6b7280" }}>Loading logs...</div>
        ) : deviceLogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: "#6b7280" }}>No logs found</div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", position: "sticky", top: 0 }}>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Type</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Value</th>
                  <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {deviceLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: 8 }}>
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
                    <td style={{ padding: 8, textAlign: "right" }}>
                      {log.log_type === "temperature" 
                        ? `${log.value}°C` 
                        : log.value || "1"}
                    </td>
                    <td style={{ padding: 8, textAlign: "right", color: "#6b7280" }}>
                      {formatDate(log.logged_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
