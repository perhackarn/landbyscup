import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { CalendarIcon } from './icons';

export function Competitions({ competitions, user }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [skiljemal, setSkiljemal] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editSkiljemal, setEditSkiljemal] = useState([]);

  const stationer = [1, 2, 3, 4, 5, 6, 7];

  function toggleSkiljemal(station) {
    setSkiljemal(prev =>
      prev.includes(station)
        ? prev.filter(s => s !== station)
        : prev.length < 3 ? [...prev, station] : prev
    );
  }

  function toggleEditSkiljemal(station) {
    setEditSkiljemal(prev =>
      prev.includes(station)
        ? prev.filter(s => s !== station)
        : prev.length < 3 ? [...prev, station] : prev
    );
  }

  const addCompetition = async () => {
    if (!user) return alert("Du måste vara inloggad!");
    if (!name || !date || skiljemal.length === 0) return alert("Fyll i namn, datum och minst 1 skiljemålsstation!");
    await addDoc(collection(db, "competitions"), { name, date, skiljemal });
    setName("");
    setDate("");
    setSkiljemal([]);
  };

  const startEdit = (c) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditDate(c.date);
    setEditSkiljemal(c.skiljemal || []);
  };

  const saveEdit = async () => {
    if (!user) return alert("Du måste vara inloggad!");
    if (!editName || !editDate || editSkiljemal.length === 0) return alert("Fyll i namn, datum och minst 1 skiljemålsstation!");
    await updateDoc(doc(db, "competitions", editId), { name: editName, date: editDate, skiljemal: editSkiljemal });
    setEditId(null);
    setEditName("");
    setEditDate("");
    setEditSkiljemal([]);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
    setEditDate("");
    setEditSkiljemal([]);
  };

  const removeCompetition = async (id) => {
    if (!user) return alert("Du måste vara inloggad!");
    if (!window.confirm("Ta bort deltävlingen?")) return;
    await deleteDoc(doc(db, "competitions", id));
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-6 text-primary-800 flex items-center gap-3">
        <CalendarIcon className="w-6 h-6" />
        Deltävlingar
      </h2>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Namn"
          className="border border-primary-300 p-3 rounded-lg flex-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border border-primary-300 p-3 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
        <div className="flex gap-3 items-center mb-2">
          <span className="font-medium text-primary-700">Skiljemål:</span>
          {stationer.map(station => (
            <label key={station} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={skiljemal.includes(station)}
                onChange={() => toggleSkiljemal(station)}
                disabled={!skiljemal.includes(station) && skiljemal.length >= 3}
                className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-primary-700">St {station}</span>
            </label>
          ))}
          <span className="text-xs text-primary-500 ml-2">(max 3 st)</span>
        </div>
        <button
          onClick={addCompetition}
          className={`bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-sm ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={!user}
        >
          Lägg till
        </button>
      </div>
      {!user && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-200">Logga in för att lägga till/ändra/tar bort deltävlingar.</p>}
      <div className="space-y-1">
        {competitions.map(c => (
          <div key={c.id} className="py-4 px-4 bg-primary-50 rounded-lg border border-primary-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {editId === c.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)} className="border border-primary-300 p-2 rounded-lg flex-1 mb-2 md:mb-0" />
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="border border-primary-300 p-2 rounded-lg flex-1 mb-2 md:mb-0" />
                <div className="flex gap-2 items-center mb-2">
                  <span className="font-medium text-primary-700">Skiljemål:</span>
                  {stationer.map(station => (
                    <label key={station} className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={editSkiljemal.includes(station)}
                        onChange={() => toggleEditSkiljemal(station)}
                        disabled={!editSkiljemal.includes(station) && editSkiljemal.length >= 3}
                        className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-primary-700">St {station}</span>
                    </label>
                  ))}
                  <span className="text-xs text-primary-500 ml-2">(max 3 st)</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={!user} className={`bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors ${!user ? "opacity-50 cursor-not-allowed" : ""}`}>Spara</button>
                  <button onClick={cancelEdit} className="bg-primary-200 hover:bg-primary-300 text-primary-700 px-3 py-2 rounded-lg font-medium transition-colors">Avbryt</button>
                </div>
              </>
            ) : (
              <>
                <span className="font-medium flex-1 text-primary-800">{c.name}</span>
                <span className="text-primary-600 flex-1">{c.date}</span>
                <span className="flex-1 text-primary-700 text-sm">
                  Skiljemål: {c.skiljemal ? c.skiljemal.map(s => `St ${s}`).join(", ") : "–"}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(c)} disabled={!user} className={`bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-2 rounded-lg font-medium transition-colors ${!user ? "opacity-50 cursor-not-allowed" : ""}`}>Ändra</button>
                  <button onClick={() => removeCompetition(c.id)} disabled={!user} className={`bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg font-medium transition-colors ${!user ? "opacity-50 cursor-not-allowed" : ""}`}>Ta bort</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}