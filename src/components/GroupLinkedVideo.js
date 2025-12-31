// src/components/GroupLinkedVideo.js - Enhanced UI with Fixed Dropdown
import React, { useEffect, useMemo, useState } from "react";
import { listVideoNames } from "../api/video";
import { listGroupNames } from "../api/group";
import { setGroupVideosByNames, listGroupVideoNames } from "../api/dvsg";

const NO_GROUP_LABEL = "— No group —";
const NO_GROUP_VALUE = "_none";

// Helper to ensure we get an array
function ensureArray(data) {
  if (Array.isArray(data)) return data;
  if (data?.items) return data.items;
  if (data?.data) return data.data;
  return [];
}

export default function GroupLinkedVideo({ onDone }) {
  const [groups, setGroups] = useState([]);
  const [videos, setVideos] = useState([]);
  const [gname, setGname] = useState("");

  const [typedVideo, setTypedVideo] = useState("");
  const [selectedVideos, setSelectedVideos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Load groups and videos
  useEffect(() => {
    (async () => {
      setInitialLoading(true);
      try {
        const [gnResult, vnResult] = await Promise.all([
          listGroupNames().catch((e) => { console.error("listGroupNames error:", e); return []; }),
          listVideoNames().catch((e) => { console.error("listVideoNames error:", e); return []; }),
        ]);
        
        // Handle different response formats
        let groupNames = ensureArray(gnResult);
        let videoNames = ensureArray(vnResult);
        
        // If items are objects, extract names
        if (groupNames.length > 0 && typeof groupNames[0] === "object") {
          groupNames = groupNames.map(g => g.gname || g.name || String(g)).filter(Boolean);
        }
        if (videoNames.length > 0 && typeof videoNames[0] === "object") {
          videoNames = videoNames.map(v => v.video_name || v.name || String(v)).filter(Boolean);
        }
        
        const uniqGroups = Array.from(new Set(groupNames));
        setGroups(uniqGroups);
        setVideos(videoNames);
        
        console.log("Loaded groups:", uniqGroups.length, "videos:", videoNames.length);
      } catch (e) {
        console.error("Failed to load lists:", e);
        setMessage("Failed to load groups/videos");
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  const gvalue = useMemo(() => {
    if (!gname) return "";
    return gname === NO_GROUP_LABEL ? NO_GROUP_VALUE : gname;
  }, [gname]);

  // When group changes, fetch current videos
  useEffect(() => {
    if (!gvalue) {
      setSelectedVideos([]);
      return;
    }
    (async () => {
      setMessage("Loading videos for this group...");
      try {
        const r = await listGroupVideoNames(gvalue);
        const names = r?.data?.video_names || r?.video_names || ensureArray(r);
        setSelectedVideos(Array.isArray(names) ? names : []);
        setMessage(names.length ? "" : "No videos linked yet. Add some below!");
      } catch (e) {
        console.error("Failed to load group videos:", e);
        setSelectedVideos([]);
        setMessage("No videos linked yet. Add some below!");
      }
    })();
  }, [gvalue]);

  const addVideo = () => {
    const v = (typedVideo || "").trim();
    if (!v) return;
    if (!videos.includes(v)) {
      setMessage(`"${v}" is not in the video list.`);
      return;
    }
    if (!selectedVideos.includes(v)) {
      setSelectedVideos((s) => [...s, v]);
      setMessage("");
    }
    setTypedVideo("");
  };

  const removeVideo = (name) => setSelectedVideos((s) => s.filter((x) => x !== name));
  const clearVideos = () => setSelectedVideos([]);

  const canSubmit = gvalue && selectedVideos.length > 0 && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await setGroupVideosByNames(gvalue, selectedVideos);
      const data = res?.data || res || {};
      const okInserted = data.inserted_count ?? 0;
      const okUpdated = data.updated_count ?? 0;
      const okDeleted = data.deleted_count ?? 0;

      setMessage(
        `✅ Linked ${selectedVideos.length} video(s) to "${gname}". ` +
        `(+${okInserted} new, ${okUpdated} refreshed, -${okDeleted} removed)`
      );
      onDone && onDone({ gname: gvalue, videos: selectedVideos, ...data });
    } catch (e) {
      const err = e?.response?.data?.detail || e?.message || "Update failed.";
      setMessage(`❌ ${err}`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        padding: 40,
        gap: 16 
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: "4px solid #e5e7eb",
          borderTopColor: "#667eea",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <p style={{ margin: 0, color: "#64748b" }}>Loading groups and videos...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Group Selection */}
      <div>
        <label style={{ 
          display: "block", 
          marginBottom: 8, 
          fontWeight: 600, 
          color: "#374151",
          fontSize: 14 
        }}>
          Select Group
          <span style={{ 
            marginLeft: 8, 
            fontWeight: 400, 
            color: "#9ca3af",
            fontSize: 13 
          }}>
            ({groups.length} available)
          </span>
        </label>
        <select
          value={gname}
          onChange={(e) => setGname(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 12,
            border: "2px solid #e5e7eb",
            fontSize: 15,
            outline: "none",
            background: "#fff",
            cursor: "pointer",
            transition: "border-color 0.2s, box-shadow 0.2s",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            backgroundSize: "20px",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#667eea";
            e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e5e7eb";
            e.target.style.boxShadow = "none";
          }}
        >
          <option value="">-- Select a group --</option>
          <option value={NO_GROUP_LABEL}>{NO_GROUP_LABEL}</option>
          {groups.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
        
        {groups.length === 0 && (
          <p style={{ 
            marginTop: 8, 
            fontSize: 13, 
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            gap: 6 
          }}>
            <span>⚠️</span> No groups found. Create groups first!
          </p>
        )}
      </div>

      {/* Video Selection */}
      <div>
        <label style={{ 
          display: "block", 
          marginBottom: 8, 
          fontWeight: 600, 
          color: "#374151",
          fontSize: 14 
        }}>
          Videos
          <span style={{ 
            marginLeft: 8, 
            fontWeight: 400, 
            color: "#9ca3af",
            fontSize: 13 
          }}>
            ({videos.length} available, {selectedVideos.length} selected)
          </span>
        </label>
        
        {/* Selected Videos Tags */}
        <div
          style={{
            minHeight: 60,
            padding: 12,
            borderRadius: 12,
            border: "2px solid #e5e7eb",
            background: "#fafafa",
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {selectedVideos.length === 0 ? (
            <span style={{ color: "#9ca3af", fontSize: 14 }}>
              No videos selected. Add videos below.
            </span>
          ) : (
            selectedVideos.map((v) => (
              <span
                key={v}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 12px",
                  borderRadius: 20,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 500,
                  boxShadow: "0 2px 4px rgba(102, 126, 234, 0.3)",
                }}
              >
                🎬 {v}
                <button
                  type="button"
                  onClick={() => removeVideo(v)}
                  style={{
                    border: "none",
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    cursor: "pointer",
                    color: "#fff",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 4,
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>

        {/* Add Video Input */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              list="video-list"
              value={typedVideo}
              onChange={(e) => setTypedVideo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addVideo();
                }
              }}
              placeholder={videos.length > 0 ? "Type to search videos..." : "No videos available"}
              disabled={videos.length === 0}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: "2px solid #e5e7eb",
                fontSize: 15,
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
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
            <datalist id="video-list">
              {videos.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>
          <button
            type="button"
            onClick={addVideo}
            disabled={!typedVideo}
            style={{
              padding: "14px 24px",
              borderRadius: 12,
              border: "none",
              background: typedVideo ? "#10b981" : "#e5e7eb",
              color: typedVideo ? "#fff" : "#9ca3af",
              fontSize: 14,
              fontWeight: 600,
              cursor: typedVideo ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            Add
          </button>
          <button
            type="button"
            onClick={clearVideos}
            disabled={selectedVideos.length === 0}
            style={{
              padding: "14px 24px",
              borderRadius: 12,
              border: "2px solid #e5e7eb",
              background: "#fff",
              color: selectedVideos.length > 0 ? "#64748b" : "#d1d5db",
              fontSize: 14,
              fontWeight: 600,
              cursor: selectedVideos.length > 0 ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          onClick={submit}
          disabled={!canSubmit}
          style={{
            padding: "16px 32px",
            borderRadius: 12,
            border: "none",
            background: canSubmit 
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
              : "#e5e7eb",
            color: canSubmit ? "#fff" : "#9ca3af",
            fontSize: 16,
            fontWeight: 600,
            cursor: canSubmit ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            boxShadow: canSubmit ? "0 4px 14px 0 rgba(102, 126, 234, 0.4)" : "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: 18,
                height: 18,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }} />
              Saving...
            </>
          ) : (
            <>🔗 Link Videos</>
          )}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 12,
            background: message.startsWith("✅") 
              ? "#ecfdf5" 
              : message.startsWith("❌") 
                ? "#fef2f2" 
                : "#f0f9ff",
            border: `1px solid ${
              message.startsWith("✅") 
                ? "#a7f3d0" 
                : message.startsWith("❌") 
                  ? "#fecaca" 
                  : "#bae6fd"
            }`,
            color: message.startsWith("✅") 
              ? "#065f46" 
              : message.startsWith("❌") 
                ? "#991b1b" 
                : "#0369a1",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {message}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
