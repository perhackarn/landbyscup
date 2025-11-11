/**
 * Landbys Cup - Main Application Component
 * 
 * TODO: Refactor - This file is large (1200+ lines) and contains multiple components.
 * Consider splitting into separate component files in a components/ directory:
 * - components/Header.jsx
 * - components/LoginBox.jsx
 * - components/Competitions.jsx
 * - components/Shooters.jsx
 * - components/Scores.jsx
 * - components/Results.jsx
 * - components/CupResults.jsx
 * - components/icons/index.jsx (for all SVG icons)
 * 
 * This will improve maintainability and code organization.
 */

import React from 'react';
import { db, auth } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import {
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from 'firebase/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// SVG Icon Components
const CalendarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const TargetIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const ClipboardIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const TrophyIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55.47.98.97 1.21C12.04 18.75 14 20 16 20s4-1.25 5.03-1.79c.5-.23.97-.66.97-1.21v-2.34"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const AwardIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// Custom hooks
function useAuth() {
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsub();
  }, []);
  return user;
}

// Login Component
function LoginBox() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const user = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert(error.message);
    }
  };

  if (user) return null;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm max-w-md mx-auto mt-8 border border-primary-200">
      <h2 className="text-lg font-semibold mb-4 text-center text-primary-800">Logga in</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-post"
        className="border border-primary-300 p-3 w-full mb-3 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Lösenord"
        className="border border-primary-300 p-3 w-full mb-4 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
      />
      <button
        onClick={handleLogin}
        className="w-full bg-primary-700 hover:bg-primary-800 text-white px-4 py-3 rounded-lg font-medium transition-colors"
      >
        Logga in
      </button>
    </div>
  );
}

// Header Component
function Header() {
  const user = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <header className="w-full py-4 bg-primary-800 shadow-sm sticky top-0 z-10 border-b border-primary-700">
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
        <h1 className="text-lg md:text-2xl font-semibold text-white tracking-tight flex items-center gap-2 md:gap-3">
          <TargetIcon className="w-7 h-7 md:w-8 md:h-8 text-amber-400" />
          Landbys Cup
        </h1>
        <div className="text-primary-200 text-sm">
          {user ? (
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
              <span className="text-primary-200 text-xs sm:text-sm truncate">
                {user.email || user.displayName}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md font-medium text-sm transition-colors flex-shrink-0"
              >
                Logga ut
              </button>
            </div>
          ) : (
            <span className="text-primary-300 text-sm">Ej inloggad</span>
          )}
        </div>
      </div>
    </header>
  );
}

// Tab Button Component
function TabBtn({ active, onClick, icon, children }) {
  return (
    <button
      className={`flex-1 min-w-[140px] px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 border ${
        active
          ? "bg-primary-700 text-white border-primary-700 shadow-sm"
          : "bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100 hover:border-primary-300"
      }`}
      onClick={onClick}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span>{children}</span>
    </button>
  );
}

// Competitions Component
function Competitions({ competitions, user }) {
  const [name, setName] = React.useState("");
  const [date, setDate] = React.useState("");
  const [skiljemal, setSkiljemal] = React.useState([]);
  const [editId, setEditId] = React.useState(null);
  const [editName, setEditName] = React.useState("");
  const [editDate, setEditDate] = React.useState("");
  const [editSkiljemal, setEditSkiljemal] = React.useState([]);

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

// Shooters Component
function Shooters({ shooters, user }) {
  const [search, setSearch] = React.useState("");
  const filteredShooters = shooters.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.club.toLowerCase().includes(search.toLowerCase()) ||
    String(s.startNumber).includes(search)
  );

  const [name, setName] = React.useState("");
  const [club, setClub] = React.useState("");
  const [klass, setKlass] = React.useState("öppen");
  const [confirmation, setConfirmation] = React.useState(null);

  const [editId, setEditId] = React.useState(null);
  const [editName, setEditName] = React.useState("");
  const [editClub, setEditClub] = React.useState("");
  const [editKlass, setEditKlass] = React.useState("öppen");

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

// Scores Component
function Scores({ shooters, competitions, user, scores }) {
  const [competitionId, setCompetitionId] = React.useState("");
  const [station, setStation] = React.useState(1);
  const [searchShooter, setSearchShooter] = React.useState("");
  const [filteredShooters, setFilteredShooters] = React.useState([]);
  const [shooterId, setShooterId] = React.useState("");
  const [shots, setShots] = React.useState([
    { value: 0, femetta: false },
    { value: 0, femetta: false },
    { value: 0, femetta: false },
    { value: 0, femetta: false },
    { value: 0, femetta: false }
  ]);

  const [existingScores, setExistingScores] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);

  React.useEffect(() => {
    if (searchShooter === "") {
      setFilteredShooters([]);
    } else {
      const search = searchShooter.toLowerCase();
      setFilteredShooters(
        shooters.filter(s =>
          s.name.toLowerCase().includes(search) ||
          String(s.startNumber).includes(search)
        )
      );
    }
  }, [searchShooter, shooters]);

  React.useEffect(() => {
    if (!competitionId || !shooterId) {
      setExistingScores([]);
      return;
    }
    const filtered = (scores || []).filter(sc =>
      sc.competitionId === competitionId &&
      sc.station === Number(station) &&
      sc.shooterId === shooterId
    ).sort((a, b) => (a._createdAt || 0) - (b._createdAt || 0));
    setExistingScores(filtered);
  }, [competitionId, station, shooterId, scores]);

  const selectShooter = (s) => {
    setShooterId(s.id);
    setSearchShooter(`#${s.startNumber} ${s.name}`);
    setFilteredShooters([]);
  };

  const startEditScore = (sc) => {
    setEditingId(sc.id);
    const existingShots = sc.shots && sc.shots.length === 5
      ? sc.shots.map(sh => ({ value: sh.value || 0, femetta: !!sh.femetta }))
      : [
          { value: 0, femetta: false },
          { value: 0, femetta: false },
          { value: 0, femetta: false },
          { value: 0, femetta: false },
          { value: 0, femetta: false }
        ];
    setShots(existingShots);
    setCompetitionId(sc.competitionId);
    setStation(sc.station);
    setShooterId(sc.shooterId);
    const s = shooters.find(x => x.id === sc.shooterId);
    if (s) setSearchShooter(`#${s.startNumber} ${s.name}`);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShots([
      { value: 0, femetta: false },
      { value: 0, femetta: false },
      { value: 0, femetta: false },
      { value: 0, femetta: false },
      { value: 0, femetta: false }
    ]);
  };

  const saveScore = async () => {
    if (!user) return alert("Du måste vara inloggad!");
    if (!competitionId || !shooterId) return alert("Välj tävling och skytt först.");

    const total = shots.reduce((a, b) => a + (Number(b.value) || 0), 0);
    const femettor = shots.filter(s => s.femetta && (s.value === 5 || s.value === 10)).length;

    try {
      if (editingId) {
        await updateDoc(doc(db, "scores", editingId), {
          competitionId,
          shooterId,
          station,
          shots,
          total,
          femettor
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "scores"), {
          competitionId,
          shooterId,
          station,
          shots,
          total,
          femettor
        });
      }

      setShots([
        { value: 0, femetta: false },
        { value: 0, femetta: false },
        { value: 0, femetta: false },
        { value: 0, femetta: false },
        { value: 0, femetta: false }
      ]);
      setShooterId("");
      setSearchShooter("");
      setFilteredShooters([]);
    } catch (e) {
      console.error(e);
      alert("Kunde inte spara poäng, försök igen.");
    }
  };

  const stationOptions = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <section>
      <h2 className="text-xl font-semibold mb-6 text-primary-800 flex items-center gap-3">
        <ClipboardIcon className="w-6 h-6" />
        Registrera poäng
      </h2>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-primary-700 mb-2">Tävling:</label>
          <select value={competitionId} onChange={e => setCompetitionId(e.target.value)} className="border border-primary-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors">
            <option value="">Välj tävling</option>
            {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-2">Station:</label>
          <select value={station} onChange={e => setStation(Number(e.target.value))}
            className="border border-primary-300 p-3 rounded-lg w-40 min-w-[120px] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors">
            {stationOptions.map(num => (
              <option key={num} value={num}>Station {num}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col flex-1 relative">
          <label className="block text-sm font-medium text-primary-700 mb-2">Sök skytt:</label>
          <input
            type="text"
            value={searchShooter}
            onChange={e => {
              setSearchShooter(e.target.value);
              setShooterId("");
            }}
            placeholder="Namn eller startnummer"
            className="border border-primary-300 p-3 rounded-lg mb-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            autoComplete="off"
          />
          {filteredShooters.length > 0 && (
            <ul className="absolute z-10 bg-white border border-primary-200 rounded-lg shadow-lg max-h-40 overflow-auto w-full top-full mt-1">
              {filteredShooters.map(s => (
                <li
                  key={s.id}
                  className="px-4 py-3 hover:bg-primary-50 cursor-pointer border-b border-primary-100 last:border-b-0"
                  onClick={() => selectShooter(s)}
                >
                  <span className="font-medium text-primary-800">#{s.startNumber} {s.name}</span> <span className="text-primary-600">({s.club})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="flex gap-3 mb-6 justify-center bg-primary-50 p-6 rounded-lg border border-primary-200">
        {shots.map((shot, i) => (
          <div key={i} className="flex flex-col items-center">
            <input
              type="number"
              min="0"
              max="10"
              value={shot.value === 0 ? "" : shot.value}
              onChange={e => {
                const ns = [...shots];
                ns[i].value = e.target.value === "" ? 0 : Number(e.target.value);
                setShots(ns);
              }}
              placeholder="0"
              className="border border-primary-300 p-3 rounded-lg w-16 text-center font-semibold text-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
            <label className="text-sm mt-2 text-primary-700 flex items-center gap-1">
              <input
                type="checkbox"
                checked={shot.femetta || false}
                onChange={e => {
                  const ns = [...shots];
                  ns[i].femetta = e.target.checked;
                  setShots(ns);
                }}
                className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
              /> 5¹/10¹
            </label>
          </div>
        ))}
      </div>
      <div className="text-lg font-semibold text-primary-800 mb-6 text-center bg-white p-4 rounded-lg border border-primary-200">
        Summa: <span className="text-primary-700">{shots.reduce((a, b) => a + (Number(b.value) || 0), 0)} poäng</span>, 5¹/10¹or: <span className="text-primary-700">{shots.filter(s => s.femetta && (s.value === 5 || s.value === 10)).length}</span>
      </div>

      <div className="text-center mb-4">
        <button onClick={saveScore}
          className={`bg-primary-700 hover:bg-primary-800 text-white px-8 py-3 rounded-lg font-medium shadow-sm transition-colors ${!user || !shooterId ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={!user || !shooterId}>{editingId ? "Uppdatera poäng" : "Spara poäng"}</button>

        {editingId && (
          <button onClick={cancelEdit} className="ml-4 bg-primary-200 hover:bg-primary-300 text-primary-700 px-4 py-3 rounded-lg font-medium transition-colors">Avbryt</button>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2"> Registrerade skott </h3>
        {(!competitionId || !shooterId) ? (
          <p className="text-sm text-primary-600">Välj tävling och skytt för att se tidigare registreringar.</p>
        ) : existingScores.length === 0 ? (
          <p className="text-sm text-primary-600">Inga registreringar hittades för denna kombination.</p>
        ) : (
          <div className="space-y-2">
            {existingScores.map(sc => (
              <div key={sc.id} className="bg-primary-50 p-3 rounded-lg border border-primary-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm text-primary-700 font-medium mb-1">Skott:</div>
                  <div className="flex gap-3 items-center">
                    {(sc.shots || []).map((sh, idx) => (
                      <div key={idx} className="text-sm font-mono px-2 py-1 bg-white border border-primary-200 rounded">
                        {String(sh.value || 0)}{sh.femetta ? "¹" : ""}
                      </div>
                    ))}
                    <div className="text-sm text-primary-700 ml-3">Summa: <span className="font-semibold">{sc.total || 0}</span></div>
                    <div className="text-sm text-primary-700 ml-3">5¹/10¹or: <span className="font-semibold">{sc.femettor || 0}</span></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEditScore(sc)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg font-medium">Ändra</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!user && <p className="text-red-600 text-sm mt-4 bg-red-50 p-3 rounded-lg border border-red-200 text-center">Logga in för att registrera poäng.</p>}
    </section>
  );
}

// Results Component
function Results({ shooters, scores, competitions }) {
  const [selectedCompetition, setSelectedCompetition] = React.useState(
    competitions.length > 0 ? competitions[0].id : ""
  );

  React.useEffect(() => {
    if (competitions.length > 0 && !selectedCompetition)
      setSelectedCompetition(competitions[0].id);
  }, [competitions]);

  const selectedComp = competitions.find(c => c.id === selectedCompetition);
  const skiljemalStationer = selectedComp?.skiljemal || [1, 2, 3];

  const allStations = Array.from(
    new Set(scores.filter(sc => sc.competitionId === selectedCompetition).map(sc => sc.station))
  ).sort((a, b) => a - b);

  const klassLista = ["öppen", "dam", "veteran", "ungdom", "junior med stöd"];

  const grouped = {};
  shooters.forEach(s => {
    const shooterScores = scores.filter(sc => sc.shooterId === s.id && sc.competitionId === selectedCompetition);
    const stationTotals = {};
    const stationFemettors = {};
    shooterScores.forEach(sc => {
      stationTotals[sc.station] = (stationTotals[sc.station] || 0) + sc.total;
      const femettor = sc.shots ? sc.shots.filter(shot => shot.femetta && (shot.value === 5 || shot.value === 10)).length : (sc.femettor || 0);
      stationFemettors[sc.station] = (stationFemettors[sc.station] || 0) + femettor;
    });
    const total = Object.values(stationTotals).reduce((a, b) => a + b, 0);
    if (!grouped[s.klass]) grouped[s.klass] = [];
    grouped[s.klass].push({ ...s, total, stationTotals, stationFemettors });
  });

  function jämförSkyttar(a, b) {
    if (b.total !== a.total) return b.total - a.total;
    for (const station of skiljemalStationer) {
      const pa = a.stationTotals?.[station] || 0;
      const pb = b.stationTotals?.[station] || 0;
      if (pb !== pa) return pb - pa;
    }
    for (const station of skiljemalStationer) {
      const fa = a.stationFemettors?.[station] || 0;
      const fb = b.stationFemettors?.[station] || 0;
      if (fb !== fa) return fb - fa;
    }
    return 0;
  }
  klassLista.forEach(k => grouped[k]?.sort(jämförSkyttar));

  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    doc.setFontSize(16);
    doc.text("Resultatlista", 105, 20, { align: "center" });
    doc.setFontSize(13);
    doc.text(selectedComp?.name || "", 105, 28, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Skiljemål: ${skiljemalStationer.map((s, i) => `Skilje ${i + 1}: St ${s}`).join(", ")}`, 60, 36);

    let startY = 42;
    klassLista.forEach(klass => {
      const rows = [];
      if (grouped[klass] && grouped[klass].length > 0) {
        grouped[klass].forEach((s, i) => {
          rows.push([
            `${i + 1}`,
            s.name,
            s.club,
            ...allStations.map(st => String(s.stationTotals[st] || 0)),
            ...skiljemalStationer.map(st => `${s.stationTotals[st] || 0}/${s.stationFemettors[st] || 0}`),
            String(s.total)
          ]);
        });
      } else {
        rows.push(["Inga deltagare"]);
      }

      const headers = [
        ["Plats", "Skytt", "Ort", ...allStations.map(st => "St " + st), ...skiljemalStationer.map((st, i) => `Skilje ${i + 1}`), "Summa"]
      ];

      doc.autoTable({
        startY,
        head: headers,
        body: rows,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 2,
          halign: "left",
          valign: "middle"
        },
        headStyles: {
          fillColor: [71, 85, 105],
          textColor: 255,
          fontStyle: "bold"
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 10, right: 10 },
        didDrawPage: (data) => {
          doc.setFontSize(13);
          doc.text(klass, 10, data.settings.startY - 4);
        }
      });
      startY = doc.lastAutoTable.finalY + 10;
    });

    doc.save(`resultatlista_${selectedComp?.name || ""}.pdf`);
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-6 text-primary-800 flex items-center gap-3">
        <TrophyIcon className="w-6 h-6" />
        Resultatlista
      </h2>
      <div className="mb-6 flex flex-wrap gap-4 items-center bg-primary-50 p-4 rounded-lg border border-primary-200">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-primary-700">Välj deltävling:</label>
          <select
            value={selectedCompetition}
            onChange={e => setSelectedCompetition(e.target.value)}
            className="border border-primary-300 p-2 rounded-lg min-w-[180px] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            {competitions.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <span className="text-primary-700 text-sm font-medium">
          Skiljemål: {skiljemalStationer.map(s => `St ${s}`).join(", ")}
        </span>
        <button onClick={exportPDF} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors ml-auto">Exportera som PDF</button>
      </div>
      {klassLista.map(klass => (
        <div key={klass} className="mb-8">
          <h3 className="text-lg font-semibold mb-4 capitalize text-primary-800 bg-primary-100 px-3 py-2 rounded-lg">{klass}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-primary-200 rounded-lg text-sm bg-white">
              <thead>
                <tr className="bg-primary-100 border-b border-primary-200">
                  <th className="p-3 text-left font-medium text-primary-800">Plats</th>
                  <th className="p-3 text-left font-medium text-primary-800">Skytt</th>
                  <th className="p-3 text-left font-medium text-primary-800">Ort</th>
                  {allStations.map(station => (
                    <th className="p-3 text-left font-medium text-primary-800" key={station}>St {station}</th>
                  ))}
                  {skiljemalStationer.map((station, idx) => (
                    <th className="p-3 text-left font-medium text-primary-800" key={"skilje" + station}>
                      Skilje {idx + 1}
                    </th>
                  ))}
                  <th className="p-3 text-left font-medium text-primary-800">Summa</th>
                </tr>
              </thead>
              <tbody>
                {(grouped[klass] || []).length === 0 ? (
                  <tr>
                    <td className="p-3 text-primary-500" colSpan={4 + allStations.length + skiljemalStationer.length}>Inga deltagare</td>
                  </tr>
                ) : (
                  grouped[klass].map((s, i) => (
                    <tr key={s.id} className="border-b border-primary-100 hover:bg-primary-50 transition-colors">
                      <td className="p-3 font-medium">
                        {i + 1}
                        {i === 0 && <span className="ml-2 text-amber-500"><AwardIcon className="w-4 h-4 inline" /></span>}
                        {i === 1 && <span className="ml-2 text-primary-400"><AwardIcon className="w-4 h-4 inline" /></span>}
                        {i === 2 && <span className="ml-2 text-amber-600"><AwardIcon className="w-4 h-4 inline" /></span>}
                      </td>
                      <td className="p-3 font-medium text-primary-800">{s.name}</td>
                      <td className="p-3 text-primary-600">{s.club}</td>
                      {allStations.map(station => (
                        <td className="p-3 font-mono text-primary-700" key={station}>{s.stationTotals[station] || 0}</td>
                      ))}
                      {skiljemalStationer.map((station, idx) => (
                        <td className="p-3 font-mono text-primary-700 font-medium" key={"skilje" + station}>
                          {(s.stationTotals[station] || 0) + "/" + (s.stationFemettors[station] || 0)}
                        </td>
                      ))}
                      <td className="p-3 font-bold text-primary-800">{s.total}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}

// CupResults Component
function CupResults({ shooters, scores, competitions }) {
  const klassLista = ["öppen", "dam", "veteran", "ungdom", "junior med stöd"];

  const competitionPlacements = {};
  competitions.forEach(c => {
    competitionPlacements[c.id] = {};
    const skiljemalStationer = c.skiljemal || [1, 2, 3];

    klassLista.forEach(klass => {
      const klassShooters = shooters.filter(s => s.klass === klass);
      const shooterResults = klassShooters.map(s => {
        const shooterScores = scores.filter(sc => sc.shooterId === s.id && sc.competitionId === c.id);
        if (shooterScores.length === 0) {
          return { ...s, total: -1, stationTotals: {}, stationFemettors: {}, participated: false };
        }

        const stationTotals = {};
        const stationFemettors = {};
        shooterScores.forEach(sc => {
          stationTotals[sc.station] = (stationTotals[sc.station] || 0) + sc.total;
          const femettor = sc.shots ? sc.shots.filter(shot => shot.femetta && (shot.value === 5 || shot.value === 10)).length : (sc.femettor || 0);
          stationFemettors[sc.station] = (stationFemettors[sc.station] || 0) + femettor;
        });
        const total = Object.values(stationTotals).reduce((a, b) => a + b, 0);
        return { ...s, total, stationTotals, stationFemettors, participated: true };
      }).filter(s => s.participated);

      function jämförSkyttar(a, b) {
        if (b.total !== a.total) return b.total - a.total;
        for (const station of skiljemalStationer) {
          const pa = a.stationTotals?.[station] || 0;
          const pb = b.stationTotals?.[station] || 0;
          if (pb !== pa) return pb - pa;
        }
        for (const station of skiljemalStationer) {
          const fa = a.stationFemettors?.[station] || 0;
          const fb = b.stationFemettors?.[station] || 0;
          if (fb !== fa) return fb - fa;
        }
        return 0;
      }

      shooterResults.sort(jämförSkyttar);

      let currentPlacement = 1;
      for (let i = 0; i < shooterResults.length; i++) {
        if (i > 0 && jämförSkyttar(shooterResults[i - 1], shooterResults[i]) !== 0) {
          currentPlacement = i + 1;
        }
        competitionPlacements[c.id][shooterResults[i].id] = currentPlacement;
      }
    });
  });

  const finalCupResults = {};
  klassLista.forEach(klass => {
    const klassShooters = shooters.filter(s => s.klass === klass);
    const results = klassShooters.map(s => {
      const placements = competitions.map(c => {
        return competitionPlacements[c.id]?.[s.id] || 1000;
      });

      const sortedPlacements = [...placements].sort((a, b) => a - b);
      const topFive = sortedPlacements.slice(0, 5);
      const cupTotal = topFive.reduce((sum, p) => sum + p, 0);

      return { ...s, placements, cupTotal };
    }).filter(s => s.cupTotal < 5000);

    results.sort((a, b) => a.cupTotal - b.cupTotal);
    finalCupResults[klass] = results;
  });

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    doc.setFontSize(16);
    doc.text("Cupresultat - Landbys Cup", 148.5, 20, { align: "center" });

    let startY = 30;
    klassLista.forEach(klass => {
      if (finalCupResults[klass] && finalCupResults[klass].length > 0) {
        if (startY > 180) {
          doc.addPage();
          startY = 20;
        }

        const headers = [["Plats", "Skytt", "Ort", ...competitions.map(c => c.name.split(' ').pop()), "Totalpoäng"]];
        const body = finalCupResults[klass].map((s, index) => [
          index + 1,
          s.name,
          s.club,
          ...s.placements.map(p => p === 1000 ? "-" : p),
          s.cupTotal
        ]);

        doc.autoTable({
          startY: startY,
          head: headers,
          body: body,
          theme: "grid",
          didDrawPage: (data) => {
            doc.setFontSize(13);
            doc.text(klass.charAt(0).toUpperCase() + klass.slice(1), 14, data.settings.startY - 4);
          },
          headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: 14, right: 14 },
        });
        startY = doc.lastAutoTable.finalY + 10;
      }
    });

    doc.save(`cupresultat_landbys_cup.pdf`);
  };

  return (
    <section>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-primary-800 flex items-center gap-3">
          <AwardIcon className="w-6 h-6" />
          Cupresultat
        </h2>
        <button onClick={exportPDF} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
          Exportera som PDF
        </button>
      </div>
      <p className="text-sm text-primary-600 mb-4 bg-primary-50 p-3 rounded-lg border border-primary-200">
        Totalpoängen baseras på de <strong>5 bästa placeringarna</strong> av de 7 deltävlingarna. Lägst poäng vinner.
        Skytt som ej deltagit i en deltävling får 1000 poäng och visas som -.
      </p>

      {klassLista.map(klass => (
        finalCupResults[klass] && finalCupResults[klass].length > 0 && (
          <div key={klass} className="mb-8">
            <h3 className="text-lg font-semibold mb-4 capitalize text-primary-800 bg-primary-100 px-3 py-2 rounded-lg">{klass}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-primary-200 rounded-lg text-sm bg-white">
                <thead>
                  <tr className="bg-primary-100 border-b border-primary-200">
                    <th className="p-3 text-left font-medium text-primary-800">Plats</th>
                    <th className="p-3 text-left font-medium text-primary-800">Skytt</th>
                    <th className="p-3 text-left font-medium text-primary-800">Ort</th>
                    {competitions.map(c => (
                      <th key={c.id} className="p-3 text-center font-medium text-primary-800" title={c.name}>
                        {c.name.replace("Deltävling", "Dt")}
                      </th>
                    ))}
                    <th className="p-3 text-right font-medium text-primary-800">Totalpoäng</th>
                  </tr>
                </thead>
                <tbody>
                  {finalCupResults[klass].map((s, index) => (
                    <tr key={s.id} className="border-b border-primary-200 last:border-0 hover:bg-primary-50">
                      <td className="p-3 font-semibold text-primary-800">{index + 1}</td>
                      <td className="p-3 font-medium text-primary-800">{s.name}</td>
                      <td className="p-3 text-primary-700">{s.club}</td>
                      {s.placements.map((p, i) => (
                        <td key={i} className="p-3 text-center text-primary-700">
                          {p === 1000 ? "-" : p}
                        </td>
                      ))}
                      <td className="p-3 text-right font-bold text-primary-800">{s.cupTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ))}
    </section>
  );
}

// Main App Component
function App() {
  const user = useAuth();
  const [competitions, setCompetitions] = React.useState([]);
  const [shooters, setShooters] = React.useState([]);
  const [scores, setScores] = React.useState([]);
  const [tab, setTab] = React.useState("results");

  React.useEffect(() => {
    const q = query(collection(db, "competitions"), orderBy("date"));
    return onSnapshot(q, (snapshot) => {
      setCompetitions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  React.useEffect(() => {
    const q = query(collection(db, "shooters"), orderBy("startNumber"));
    return onSnapshot(q, (snapshot) => {
      setShooters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  React.useEffect(() => {
    const q = query(collection(db, "scores"));
    return onSnapshot(q, (snapshot) => {
      setScores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  return (
    <>
      <Header />
      <LoginBox />
      <main className="max-w-6xl mx-auto mt-6 px-4 pb-10">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mt-6 border border-primary-200">
          <nav className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
            <TabBtn active={tab === "results"} onClick={() => setTab("results")} icon={<TrophyIcon />}>Resultatlistor</TabBtn>
            <TabBtn active={tab === "cup"} onClick={() => setTab("cup")} icon={<AwardIcon />}>Cupresultat</TabBtn>
            <TabBtn active={tab === "shooters"} onClick={() => setTab("shooters")} icon={<UsersIcon />}>Skyttar</TabBtn>
            {user && (
              <>
                <TabBtn active={tab === "competitions"} onClick={() => setTab("competitions")} icon={<CalendarIcon />}>Deltävlingar</TabBtn>
                <TabBtn active={tab === "scores"} onClick={() => setTab("scores")} icon={<ClipboardIcon />}>Registrera Poäng</TabBtn>
              </>
            )}
          </nav>
          {tab === "competitions" && user && <Competitions competitions={competitions} user={user} />}
          {tab === "shooters" && <Shooters shooters={shooters} user={user} />}
          {tab === "scores" && user && <Scores shooters={shooters} competitions={competitions} scores={scores} user={user} />}
          {tab === "results" && <Results shooters={shooters} scores={scores} competitions={competitions} />}
          {tab === "cup" && <CupResults shooters={shooters} scores={scores} competitions={competitions} />}
        </div>
      </main>
    </>
  );
}

export default App;
