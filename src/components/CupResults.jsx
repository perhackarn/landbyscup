import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AwardIcon } from './icons';

export function CupResults({ shooters, scores, competitions }) {
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
    doc.text("Cupresultat", 148.5, 20, { align: "center" });

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

        const table = autoTable(doc, {
          startY,
          head: headers,
          body: body,
          theme: "grid",
          styles: {
          fontSize: 8,
          cellPadding: 2,
          halign: "left",
          valign: "middle"
        },
          didDrawPage: (data) => {
            doc.setFontSize(12);
            doc.text(klass.charAt(0).toUpperCase() + klass.slice(1), 14, data.settings.startY - 4);
          },
          headStyles: { fontSize: 9, fillColor: [71, 85, 105], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: 14, right: 14 },
        });
        startY = (table?.finalY ?? doc.lastAutoTable?.finalY ?? startY) + 10;
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