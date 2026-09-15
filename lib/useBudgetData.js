"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthProvider";

export function useBudgetData() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [targets, setTargets] = useState({});
  const [visibleCategories, setVisibleCategories] = useState(null);
  const [recurringRules, setRecurringRules] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setTargets({});
      setVisibleCategories(null);
      setRecurringRules([]);
      setLoaded(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const ref = doc(db, "users", user.uid, "budget", "data");
      const snap = await getDoc(ref);
      if (cancelled) return;
      if (snap.exists()) {
        const data = snap.data();
        setTransactions(data.transactions || []);
        setTargets(data.targets || {});
        setVisibleCategories(data.visibleCategories || null);
        setRecurringRules(data.recurringRules || []);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!loaded || !user) return;
    const ref = doc(db, "users", user.uid, "budget", "data");
    setDoc(
      ref,
      { transactions, targets, visibleCategories, recurringRules },
      { merge: true }
    ).catch(() => {
      // best-effort save; a transient failure will retry on next change
    });
  }, [transactions, targets, visibleCategories, recurringRules, loaded, user]);

  return {
    transactions,
    setTransactions,
    targets,
    setTargets,
    visibleCategories,
    setVisibleCategories,
    recurringRules,
    setRecurringRules,
    loaded,
  };
}