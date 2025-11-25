import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { UsersIcon } from './icons';

export function Shooters({ shooters, user }) {
  const [search, setSearch] = useState("");
  const filteredShooters = shooters.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.club.toLowerCase().includes(search.toLowerCase()) ||
    String(s.startNumber).includes(search)
  );

  const [name, setName] = useState("");
  const [club, setClub] = useState("");
  const [klass, setKlass] = useState("öppen");
  const [confirmation, setConfirmation] = useState(null);

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editClub, setEditClub] = useState("");
  const [editKlass, setEditKlass] = useState("öppen");

  const addShooter = async () => {
    if (!name || !club) return;

    try {
      let newStartNumber;
      const shooterName = name;
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, "counters", "shooter");
        const counterDoc = await transaction.get(counterRef);

        if (!counterDoc.exists()) {
          throw new Error("Shooter counter document does not exist!");
        }

        newStartNumber = counterDoc.data().currentNumber + 1;
        
        const newShooterRef = doc(collection(db, "shooters"));
        
        transaction.set(newShooterRef, { name: shooterName, club, klass, startNumber: newStartNumber });
        transaction.update(counterRef, { currentNumber: newStartNumber });
      });

      setConfirmation({ name: shooterName, startNumber: newStartNumber });
      setTimeout(() => setConfirmation(null), 5000);

      setName("");
      setClub("");
    } catch (e) {
      console.error("Transaction failed: ", e);
      alert("Kunde inte lägga till skytt, försök igen.");
    }
  };

  const startEdit = (s) => {
    setEditId(s.id);
    setEditName(s.name);
    setEditClub(s.club);
    setEditKlass(s.klass);
  };

  const saveEdit = async () => {
    if (!user) return alert("Du måste vara inloggad!");
    if (!editName || !editClub) return;
    await updateDoc(doc(db, "shooters", editId), { name: editName, club: editClub, klass: editKlass });
    setEditId(null);
    setEditName("");
    setEditClub("");
    setEditKlass("öppen");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
    setEditClub("");
    setEditKlass("öppen");
  };

  const removeShooter = async (id) => {
    if (!user) return alert("Du måste vara inloggad!");
    if (!window.confirm("Ta bort skytten?")) return;
    await deleteDoc(doc(db, "shooters", id));
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-6 text-primary-800 flex items-center gap-3">
        <UsersIcon className="w-6 h-6" />
        Registrera ny skytt
      </h2>
      {confirmation && (
        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg relative mb-4 shadow-sm" role="alert">
          <strong className="font-semibold">Ny skytt registrerad:</strong>
          <span className="block sm:inline ml-2">
            Namn: {confirmation.name}, Startnummer: {confirmation.startNumber}
          </span>
          <button onClick={() => setConfirmation(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg className="fill-current h-6 w-6 text-green-600" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
            </svg>
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Namn"
          className="border border-primary-300 p-3 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
        <input
          value={club}
          onChange={e => setClub(e.target.value)}
          placeholder="Ort"
          className="border border-primary-300 p-3 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
        <select
          value={klass}
          onChange={e => setKlass(e.target.value)}
          className="border border-primary-300 p-3 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        >
          <option>öppen</option>
          <option>dam</option>
          <option>veteran</option>
          <option>ungdom</option>
          <option>junior med stöd</option>
        </select>
        <button
          onClick={addShooter}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-sm"
        >
          Lägg till
        </button>
      </div>
      {!user && <p className="text-yellow-600 text-sm mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">Logga in för att kunna ändra eller ta bort skyttar.</p>}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Sök skytt, ort eller startnummer..."
        className="border border-primary-300 p-3 rounded-lg w-full mb-6 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
      />
      <div className="space-y-1">
        {filteredShooters.map(s => (
          <div key={s.id} className="py-4 px-4 bg-primary-50 rounded-lg border border-primary-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {editId === s.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)} className="border border-primary-300 p-2 rounded-lg flex-1 mb-2 md:mb-0" />
                <input value={editClub} onChange={e => setEditClub(e.target.value)} className="border border-primary-300 p-2 rounded-lg flex-1 mb-2 md:mb-0" />
                <select value={editKlass} onChange={e => setEditKlass(e.target.value)} className="border border-primary-300 p-2 rounded-lg flex-1 mb-2 md:mb-0">
                  <option>öppen</option>
                  <option>dam</option>
                  <option>veteran</option>
                  <option>ungdom</option>
                  <option>junior med stöd</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={!user} className={`bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors ${!user ? "opacity-50 cursor-not-allowed" : ""}`}>Spara</button>
                  <button onClick={cancelEdit} className="bg-primary-200 hover:bg-primary-300 text-primary-700 px-3 py-2 rounded-lg font-medium transition-colors">Avbryt</button>
                </div>
              </>
            ) : (
              <>
                <span className="font-semibold text-primary-700 bg-primary-100 px-3 py-1 rounded-full text-sm">#{s.startNumber}</span>
                <span className="flex-1 font-medium text-primary-800">{s.name} <span className="text-primary-600 font-normal">({s.club})</span></span>
                <span className="bg-primary-200 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">{s.klass}</span>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(s)} disabled={!user} className={`bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-2 rounded-lg font-medium transition-colors ${!user ? "opacity-50 cursor-not-allowed" : ""}`}>Ändra</button>
                  <button onClick={() => removeShooter(s.id)} disabled={!user} className={`bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg font-medium transition-colors ${!user ? "opacity-50 cursor-not-allowed" : ""}`}>Ta bort</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}