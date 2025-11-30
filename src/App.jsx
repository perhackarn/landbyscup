import React, { useState } from 'react';
import { orderBy } from 'firebase/firestore';
import { useAuth } from './hooks/useAuth';
import { useOptimizedFirestoreV2 } from './hooks/useOptimizedFirestoreV2';
import { Header } from './components/Header';
import { LoginBox } from './components/LoginBox';
import { TabBtn } from './components/TabBtn';
import { Competitions } from './components/Competitions';
import { Shooters } from './components/Shooters';
import { Scores } from './components/Scores';
import { Results } from './components/Results';
import { CupResults } from './components/CupResults';
import {
  CalendarIcon,
  UsersIcon,
  ClipboardIcon,
  TrophyIcon,
  AwardIcon
} from './components/icons';

function App() {
  const user = useAuth();
  const [tab, setTab] = useState("results");

  // Konditionell laddning - ladda bara data som faktiskt behövs för aktiv tab
  const needsCompetitions = tab === "competitions" || tab === "scores" || tab === "results" || tab === "cup";
  const needsShooters = tab === "shooters" || tab === "scores" || tab === "results" || tab === "cup";
  const needsScores = tab === "scores" || tab === "results" || tab === "cup";

  const { 
    data: competitions, 
    loading: loadingCompetitions 
  } = useOptimizedFirestoreV2("competitions", [orderBy("date")], needsCompetitions, "competitions");
  
  const { 
    data: shooters, 
    loading: loadingShooters 
  } = useOptimizedFirestoreV2("shooters", [orderBy("startNumber")], needsShooters, "shooters");
  
  const { 
    data: scores, 
    loading: loadingScores 
  } = useOptimizedFirestoreV2("scores", [], needsScores, "scores");

  // Bara visa loading om vi faktiskt behöver data för den aktiva tabben
  const isLoading = (needsCompetitions && loadingCompetitions) || 
                    (needsShooters && loadingShooters) || 
                    (needsScores && loadingScores);

  return (
    <>
      <Header />
      <LoginBox />
      <main className="max-w-6xl mx-auto mt-6 px-4 pb-10">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mt-6 border border-primary-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
              <span className="ml-3 text-primary-700">Laddar data...</span>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default App;
