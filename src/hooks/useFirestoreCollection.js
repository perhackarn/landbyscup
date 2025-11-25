import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreCollection(collectionName, queryConstraints = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    
    let q;
    if (queryConstraints.length > 0) {
      q = query(collection(db, collectionName), ...queryConstraints);
    } else {
      q = collection(db, collectionName);
    }
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error loading ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // Only depend on collectionName, not on queryConstraints
  }, [collectionName]); // <-- Ta bort queryConstraints här!

  return { data, loading, error };
}