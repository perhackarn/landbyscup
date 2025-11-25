import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TrophyIcon, AwardIcon } from './icons';

export function Results({ shooters, scores, competitions }) {
  const [selectedCompetition, setSelectedCompetition] = useState(
    competitions.length > 0 ? competitions[0].id : ""
  );

  useEffect(() => {
    if (competitions.length > 0 && !selectedCompetition)
      setSelectedCompetition(competitions[0].id);
  }, [competitions, selectedCompetition]);

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

      const table = autoTable(doc, {
        startY,
        head: headers,
        body: rows,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          halign: "left",
          valign: "middle"
        },
        headStyles: {
          fontSize: 9,
          fillColor: [71, 85, 105],
          textColor: 255,
          fontStyle: "bold"
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 10, right: 10 },
        didDrawPage: (data) => {
          doc.setFontSize(12);
          doc.text(klass, 10, data.settings.startY - 4);     
        }
      });
      startY = (table?.finalY ?? doc.lastAutoTable?.finalY ?? startY) + 10;
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