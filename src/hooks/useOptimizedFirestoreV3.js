import { useState, useEffect, useRef, useMemo } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Utökad version med mer avancerade query-strategier
const globalCache = new Map();
const globalListeners = new Map();

export function useOptimizedFirestoreV3(
  collectionName, 
  queryConstraints = [], 
  enabled = true,
  cacheKey = null,
  maxAge = 5 * 60 * 1000,
  options = {}
) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef();
  
  const { 
    useRealtime = true, 
    pageSize = null, 
    mergeWithCache = false 
  } = options;
  
  const effectiveCacheKey = cacheKey || `${collectionName}_${JSON.stringify(queryConstraints)}_${JSON.stringify(options)}`;

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

    // Cache check
    const cached = globalCache.get(effectiveCacheKey);
    if (cached && (Date.now() - cached.timestamp < maxAge)) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    // För stora datasets, använd pagination istället för realtime
    if (pageSize && !useRealtime) {
      fetchPaginatedData();
      return;
    }

    // Existing realtime logic...
    handleRealtimeQuery();

  }, [collectionName, memoizedQueryConstraints, enabled, effectiveCacheKey, maxAge]);

  const fetchPaginatedData = async () => {
    setLoading(true);
    try {
      let q = collection(db, collectionName);
      if (memoizedQueryConstraints.length > 0) {
        q = query(q, ...memoizedQueryConstraints, limit(pageSize));
      }
      
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      globalCache.set(effectiveCacheKey, {
        data: items,
        timestamp: Date.now()
      });
      
      setData(items);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  const handleRealtimeQuery = () => {
    // Existing realtime listener logic from useOptimizedFirestoreV2
    const existingListener = globalListeners.get(effectiveCacheKey);
    if (existingListener) {
      existingListener.subscribers.add(setData);
      setData(existingListener.currentData);
      setLoading(false);
      
      return () => {
        existingListener.subscribers.delete(setData);
        if (existingListener.subscribers.size === 0) {
          existingListener.unsubscribe();
          globalListeners.delete(effectiveCacheKey);
        }
      };
    }

    setLoading(true);
    let q = collection(db, collectionName);
    if (memoizedQueryConstraints.length > 0) {
      q = query(q, ...memoizedQueryConstraints);
    }
    
    const subscribers = new Set([setData]);
    let currentData = [];
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      currentData = items;
      globalCache.set(effectiveCacheKey, {
        data: items,
        timestamp: Date.now()
      });
      
      subscribers.forEach(setter => setter(items));
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    globalListeners.set(effectiveCacheKey, {
      unsubscribe,
      subscribers,
      currentData
    });

    return () => {
      subscribers.delete(setData);
      if (subscribers.size === 0) {
        unsubscribe();
        globalListeners.delete(effectiveCacheKey);
      }
    };
  };

  return { data, loading, error };
}

// Specifika hooks för olika användningsfall
export function useCompetitionScores(competitionId, enabled = true) {
  return useOptimizedFirestoreV3(
    'scores',
    competitionId ? [where('competitionId', '==', competitionId)] : [],
    enabled && !!competitionId,
    `scores_competition_${competitionId}`,
    10 * 60 * 1000, // 10 min cache för scores
    { useRealtime: true } // Scores behöver realtime för live updates
  );
}

// Hook för att ladda bara nödvändiga skyttar baserat på klass
export function useShootersByClass(targetClass, enabled = true) {
  return useOptimizedFirestoreV3(
    'shooters',
    targetClass ? [where('klass', '==', targetClass), orderBy('startNumber')] : [orderBy('startNumber')],
    enabled,
    `shooters_class_${targetClass || 'all'}`,
    15 * 60 * 1000 // Längre cache för skyttar som ändras sällan
  );
}

// Hook för begränsad tävlingsladdning (bara senaste)
export function useRecentCompetitions(limit = 5, enabled = true) {
  return useOptimizedFirestoreV3(
    'competitions',
    [orderBy('date', 'desc'), limit(limit)],
    enabled,
    `competitions_recent_${limit}`,
    5 * 60 * 1000
  );
}

// Hook för att få bara aktiva tävlingar
export function useActiveCompetitions(enabled = true) {
  const today = new Date().toISOString().split('T')[0];
  return useOptimizedFirestoreV3(
    'competitions',
    [where('date', '>=', today), orderBy('date')],
    enabled,
    `competitions_active_${today}`,
    2 * 60 * 1000 // Kortare cache för aktiva tävlingar
  );
}

// Batch-laddning för scores med intelligent caching
export function useScoresBatch(competitionIds = [], enabled = true) {
  return useOptimizedFirestoreV3(
    'scores',
    competitionIds.length > 0 ? [where('competitionId', 'in', competitionIds.slice(0, 10))] : [],
    enabled && competitionIds.length > 0,
    `scores_batch_${competitionIds.sort().join('_')}`,
    8 * 60 * 1000
  );
}