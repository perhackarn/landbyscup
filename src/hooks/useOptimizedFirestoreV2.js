import { useState, useEffect, useRef, useMemo } from 'react';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';

// Global cache för att dela data mellan komponenter
const globalCache = new Map();
const globalListeners = new Map();

export function useOptimizedFirestoreV2(
  collectionName, 
  queryConstraints = [], 
  enabled = true,
  cacheKey = null,
  maxAge = 5 * 60 * 1000 // 5 minuter default cache
) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef();
  
  // Skapa en unik cache-nyckel baserad på collection och constraints
  const effectiveCacheKey = cacheKey || `${collectionName}_${JSON.stringify(queryConstraints)}`;

  const memoizedQueryConstraints = useMemo(() => queryConstraints, [
    queryConstraints.length,
    queryConstraints.map(c => c.toString()).join(',')
  ]);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Kolla cache först
    const cached = globalCache.get(effectiveCacheKey);
    if (cached && (Date.now() - cached.timestamp < maxAge)) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    // Kolla om vi redan har en listener för samma data
    const existingListener = globalListeners.get(effectiveCacheKey);
    if (existingListener) {
      // Lägg till denna komponent som subscriber
      existingListener.subscribers.add(setData);
      setData(existingListener.currentData);
      setLoading(false);
      
      const cleanup = () => {
        existingListener.subscribers.delete(setData);
        if (existingListener.subscribers.size === 0) {
          existingListener.unsubscribe();
          globalListeners.delete(effectiveCacheKey);
        }
      };
      
      return cleanup;
    }

    setLoading(true);
    setError(null);

    let q;
    if (memoizedQueryConstraints.length > 0) {
      q = query(collection(db, collectionName), ...memoizedQueryConstraints);
    } else {
      q = collection(db, collectionName);
    }
    
    const subscribers = new Set([setData]);
    let currentData = [];
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        currentData = items;
        
        // Uppdatera cache
        globalCache.set(effectiveCacheKey, {
          data: items,
          timestamp: Date.now()
        });
        
        // Uppdatera alla subscribers
        subscribers.forEach(setter => {
          setter(items);
        });
        
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error loading ${collectionName}:`, err);
        setError(err);
        setLoading(false);
        
        subscribers.forEach(setter => {
          // Här skulle vi kunna sätta error state för alla subscribers
        });
      }
    );

    // Registrera listener globalt
    globalListeners.set(effectiveCacheKey, {
      unsubscribe,
      subscribers,
      currentData
    });

    unsubscribeRef.current = () => {
      subscribers.delete(setData);
      if (subscribers.size === 0) {
        unsubscribe();
        globalListeners.delete(effectiveCacheKey);
      }
    };

    return unsubscribeRef.current;
  }, [collectionName, memoizedQueryConstraints, enabled, effectiveCacheKey, maxAge]);

  return { data, loading, error };
}

// Hook för att få data för en specifik tävling (mer effektiv än att ladda allt)
export function useCompetitionScores(competitionId, enabled = true) {
  return useOptimizedFirestoreV2(
    'scores',
    competitionId ? [where('competitionId', '==', competitionId)] : [],
    enabled && !!competitionId,
    `scores_competition_${competitionId}`
  );
}

// Hook för att få poäng för en specifik skytt och tävling
export function useShooterCompetitionScores(shooterId, competitionId, enabled = true) {
  return useOptimizedFirestoreV2(
    'scores',
    shooterId && competitionId ? [
      where('shooterId', '==', shooterId),
      where('competitionId', '==', competitionId)
    ] : [],
    enabled && !!shooterId && !!competitionId,
    `scores_shooter_${shooterId}_competition_${competitionId}`
  );
}

// Funktion för att rensa cache (användbar vid explicit refresh)
export function clearFirestoreCache(cacheKey = null) {
  if (cacheKey) {
    globalCache.delete(cacheKey);
  } else {
    globalCache.clear();
  }
}