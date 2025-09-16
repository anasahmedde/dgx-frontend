import React, { useState, useEffect } from "react";
import {
  insertDevice,
  getDevice,
  listDevices,
  updateDevice,
  deleteDevice,
} from "../api/device";

export default function Device() {
  const [devices, setDevices] = useState([]);
  const [mobileId, setMobileId] = useState("");
  const [status, setStatus] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    const res = await listDevices();
    setDevices(res.data.items);
  };

  const handleInsert = async () => {
    await insertDevice(mobileId, status);
    setMobileId("");
    setStatus(false);
    loadDevices();
  };

  const handleDelete = async (id) => {
    await deleteDevice(id);
    loadDevices();
  };

  return (
    <div>
      <h2>Device Management</h2>
      <input
        type="text"
        placeholder="Mobile ID"
        value={mobileId}
        onChange={(e) => setMobileId(e.target.value)}
      />
      <label>
        Downloaded:
        <input
          type="checkbox"
          checked={status}
          onChange={(e) => setStatus(e.target.checked)}
        />
      </label>
      <button onClick={handleInsert}>Add Device</button>

      <ul>
        {devices.map((d) => (
          <li key={d.id}>
            {d.mobile_id} - {d.download_status ? "✅" : "❌"}
            <button onClick={() => handleDelete(d.mobile_id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
