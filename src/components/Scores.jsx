import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ClipboardIcon } from './icons';

export function Scores({ shooters, competitions, user }) {
  const [competitionId, setCompetitionId] = useState("");
  const [station, setStation] = useState(1);
  const [searchShooter, setSearchShooter] = useState("");
  const [filteredShooters, setFilteredShooters] = useState([]);
  const [shooterId, setShooterId] = useState("");
  const [shots, setShots] = useState([
    { value: 0, femetta: false },
    { value: 0, femetta: false },
    { value: 0, femetta: false },
    { value: 0, femetta: false },
    { value: 0, femetta: false }
  ]);
  const [editingId, setEditingId] = useState(null);
  const [existingScores, setExistingScores] = useState([]);
  const [scoresLoading, setScoresLoading] = useState(false);

  // Ladda scores direkt med Firestore onSnapshot
  useEffect(() => {
    if (!competitionId || !shooterId || !station) {
      setExistingScores([]);
      setScoresLoading(false);
      return;
    }

    setScoresLoading(true);
    
    const q = query(
      collection(db, 'scores'),
      where('competitionId', '==', competitionId),
      where('shooterId', '==', shooterId),
      where('station', '==', Number(station)),
      orderBy('__name__')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scores = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExistingScores(scores);
      setScoresLoading(false);
    }, (error) => {
      console.error('Error loading scores:', error);
      setScoresLoading(false);
    });

    return () => unsubscribe();
  }, [competitionId, shooterId, station]);

  // Memoized shooter filtering för prestanda
  const memoizedShooterFiltering = useMemo(() => {
    if (!searchShooter.trim()) return [];
    
    const search = searchShooter.toLowerCase();
    return shooters.filter(s =>
      s.name.toLowerCase().includes(search) ||
      String(s.startNumber).includes(search) ||
      s.club.toLowerCase().includes(search)
    ).slice(0, 10); // Begränsa till 10 resultat för prestanda
  }, [searchShooter, shooters]);

  useEffect(() => {
    setFilteredShooters(memoizedShooterFiltering);
  }, [memoizedShooterFiltering]);

  const selectShooter = (s) => {
    setShooterId(s.id);
    setSearchShooter(`#${s.startNumber} ${s.name}`);
    setFilteredShooters([]);
    // Rensa eventuell redigeringsstate när vi byter skytt
    if (editingId) {
      cancelEdit();
    }
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

  const deleteScore = async (scoreId) => {
    if (!user) return alert("Du måste vara inloggad!");
    
    const confirmed = window.confirm("Är du säker på att du vill radera denna registrering? Detta går inte att ångra.");
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "scores", scoreId));
      // Om vi redigerade just denna score, avbryt redigeringen
      if (editingId === scoreId) {
        cancelEdit();
      }
    } catch (e) {
      console.error("Error deleting score:", e);
      alert("Kunde inte radera registreringen, försök igen.");
    }
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
          femettor,
          updatedAt: new Date().toISOString() // Lägg till timestamp för bättre tracking
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "scores"), {
          competitionId,
          shooterId,
          station,
          shots,
          total,
          femettor,
          createdAt: new Date().toISOString(),
          createdBy: user.uid // Spåra vem som skapade poängen
        });
      }

      // Rensa formuläret efter lyckad sparning
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
      console.error("Error saving score:", e);
      alert("Kunde inte spara poäng, försök igen.");
    }
  };

  // Beräkna totalsumma för alla skott på denna station/skytt/tävling
  const stationTotal = useMemo(() => {
    return existingScores.reduce((sum, score) => sum + (score.total || 0), 0);
  }, [existingScores]);

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
          <select 
            value={competitionId} 
            onChange={e => {
              setCompetitionId(e.target.value);
              // Rensa shooter selection när tävling ändras
              setShooterId("");
              setSearchShooter("");
            }} 
            className="border border-primary-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="">Välj tävling</option>
            {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-2">Station:</label>
          <select 
            value={station} 
            onChange={e => {
              setStation(Number(e.target.value));
              // Rensa redigeringsstate när vi byter station
              if (editingId) {
                cancelEdit();
              }
            }}
            className="border border-primary-300 p-3 rounded-lg w-40 min-w-[120px] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
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
              // Rensa redigeringsstate när vi byter skytt
              if (editingId) {
                cancelEdit();
              }
            }}
            placeholder="Namn, startnummer eller klubb"
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
                  <span className="font-medium text-primary-800">#{s.startNumber} {s.name}</span> 
                  <span className="text-primary-600 ml-2">({s.club})</span>
                  <span className="text-xs text-primary-500 ml-2">{s.klass}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Visa befintlig total för denna kombination */}
      {competitionId && shooterId && station && existingScores.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-700">
            <strong>Nuvarande total för denna station:</strong> {stationTotal} poäng ({existingScores.length} registreringar)
          </div>
        </div>
      )}
      
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
        Summa: <span className="text-primary-700">{shots.reduce((a, b) => a + (Number(b.value) || 0), 0)} poäng</span>, 
        5¹/10¹or: <span className="text-primary-700">{shots.filter(s => s.femetta && (s.value === 5 || s.value === 10)).length}</span>
      </div>

      <div className="text-center mb-4">
        <button 
          onClick={saveScore}
          className={`bg-primary-700 hover:bg-primary-800 text-white px-8 py-3 rounded-lg font-medium shadow-sm transition-colors ${
            !user || !shooterId ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!user || !shooterId}
        >
          {editingId ? "Uppdatera poäng" : "Spara poäng"}
        </button>

        {editingId && (
          <button 
            onClick={cancelEdit} 
            className="ml-4 bg-primary-200 hover:bg-primary-300 text-primary-700 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Avbryt
          </button>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2">Registrerade skott</h3>
        {scoresLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-700"></div>
            <span className="ml-2 text-primary-700">Laddar...</span>
          </div>
        ) : !competitionId || !shooterId || !station ? (
          <p className="text-sm text-primary-600">Välj tävling och skytt för att se tidigare registreringar.</p>
        ) : existingScores.length === 0 ? (
          <p className="text-sm text-primary-600">Inga registreringar hittades för denna kombination.</p>
        ) : (
          <div className="space-y-2">
            {existingScores.map((sc, index) => (
              <div key={sc.id} className="bg-primary-50 p-3 rounded-lg border border-primary-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm text-primary-700 font-medium mb-1">
                    Skott #{index + 1}:
                  </div>
                  <div className="flex gap-3 items-center">
                    {(sc.shots || []).map((sh, idx) => (
                      <div key={idx} className="text-sm font-mono px-2 py-1 bg-white border border-primary-200 rounded">
                        {String(sh.value || 0)}{sh.femetta ? "¹" : ""}
                      </div>
                    ))}
                    <div className="text-sm text-primary-700 ml-3">
                      Summa: <span className="font-semibold">{sc.total || 0}</span>
                    </div>
                    <div className="text-sm text-primary-700 ml-3">
                      5¹/10¹or: <span className="font-semibold">{sc.femettor || 0}</span>
                    </div>
                    {sc.createdAt && (
                      <div className="text-xs text-primary-500 ml-3">
                        {new Date(sc.createdAt).toLocaleString('sv-SE')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => startEditScore(sc)} 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                  >
                    Ändra
                  </button>
                  <button 
                    onClick={() => deleteScore(sc.id)} 
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                  >
                    Ta bort
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!user && (
        <p className="text-red-600 text-sm mt-4 bg-red-50 p-3 rounded-lg border border-red-200 text-center">
          Logga in för att registrera poäng.
        </p>
      )}
    </section>
  );
}