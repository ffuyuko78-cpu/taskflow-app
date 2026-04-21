import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function useAppDate(uid) {
  const [appDate, setAppDate] = useState(toDateStr(new Date()));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'users', uid, 'settings', 'state');
    const unsub = onSnapshot(ref, (snap) => {
      const today = toDateStr(new Date());
      if (snap.exists() && snap.data().appDate) {
        const saved = snap.data().appDate;
        if (saved < today) {
          setDoc(ref, { appDate: today }, { merge: true });
          setAppDate(today);
        } else {
          setAppDate(saved);
        }
      } else {
        setDoc(ref, { appDate: today }, { merge: true });
        setAppDate(today);
      }
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const updateAppDate = useCallback(async (dateStr) => {
    if (!uid) return;
    const ref = doc(db, 'users', uid, 'settings', 'state');
    await setDoc(ref, { appDate: dateStr }, { merge: true });
    setAppDate(dateStr);
  }, [uid]);

  return { appDate, setAppDate: updateAppDate, loading };
}
