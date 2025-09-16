import React, { useEffect, useState } from "react";
import { insertGroup, getGroup, listGroups, updateGroup, deleteGroup } from "../api/group";

export default function Group() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [gname, setGname] = useState("");
  const [newName, setNewName] = useState("");

  const load = async () => {
    const res = await listGroups({ q, limit: 50, offset: 0 });
    setItems(res.data.items);
  };

  useEffect(() => { load(); }, []); // load on mount

  const add = async () => {
    if (!gname.trim()) return;
    await insertGroup(gname.trim());
    setGname("");
    load();
  };

  const rename = async (name) => {
    if (!newName.trim()) return;
    await updateGroup(name, { gname: newName.trim() });
    setNewName("");
    load();
  };

  const remove = async (name) => {
    await deleteGroup(name);
    load();
  };

  return (
    <div>
      <h2>Groups</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input placeholder="search (q)" value={q} onChange={(e) => setQ(e.target.value)} />
        <button onClick={load}>Search</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input placeholder="new group name" value={gname} onChange={(e) => setGname(e.target.value)} />
        <button onClick={add}>Add Group</button>
      </div>

      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <strong>{it.gname}</strong> &nbsp; (id: {it.id})
            <div style={{ display: "inline-flex", gap: 8, marginLeft: 12 }}>
              <input placeholder="rename to..." value={newName} onChange={(e) => setNewName(e.target.value)} />
              <button onClick={() => rename(it.gname)}>Rename</button>
              <button onClick={() => remove(it.gname)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

