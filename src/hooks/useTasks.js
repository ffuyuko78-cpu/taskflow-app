import { useState, useEffect, useCallback } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

export function useTasks(uid) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, 'users', uid, 'tasks'),
      orderBy('order', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTasks(data);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const addTask = useCallback(async (category, text, date = null, dueDate = null, calendarEventId = null) => {
    if (!uid || !text.trim()) return;
    const sameCat = tasks.filter(t => t.category === category);
    const maxOrder = sameCat.length > 0 ? Math.max(...sameCat.map(t => t.order)) : -1;
    await addDoc(collection(db, 'users', uid, 'tasks'), {
      text: text.trim(),
      category,
      order: maxOrder + 1,
      date: date || null,
      dueDate: dueDate || null,
      completed: false,
      completedAt: null,
      createdAt: serverTimestamp(),
      ...(calendarEventId ? { calendarEventId } : {}),
    });
  }, [uid, tasks]);

  // カレンダーから取り込んだタスクを全削除（calendarEventId付き）
  const deleteAllCalendarTasks = useCallback(async () => {
    if (!uid) return;
    const calTasks = tasks.filter(t => t.calendarEventId);
    if (calTasks.length === 0) return;
    const batch = writeBatch(db);
    calTasks.forEach(t => batch.delete(doc(db, 'users', uid, 'tasks', t.id)));
    await batch.commit();
  }, [uid, tasks]);

  // 「明日以降」カテゴリのタスクを全削除（完全リセット用）
  const deleteAllFutureTasks = useCallback(async () => {
    if (!uid) return;
    const futureTasks = tasks.filter(t => t.category === 'future');
    if (futureTasks.length === 0) return;
    const batch = writeBatch(db);
    futureTasks.forEach(t => batch.delete(doc(db, 'users', uid, 'tasks', t.id)));
    await batch.commit();
  }, [uid, tasks]);

  const updateTask = useCallback(async (taskId, updates) => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid, 'tasks', taskId), updates);
  }, [uid]);

  const deleteTask = useCallback(async (taskId) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'tasks', taskId));
  }, [uid]);

  const toggleComplete = useCallback(async (taskId, current) => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
      completed: !current,
      completedAt: !current ? serverTimestamp() : null,
    });
  }, [uid]);

  const reorderTasks = useCallback(async (category, orderedIds) => {
    if (!uid) return;
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      batch.update(doc(db, 'users', uid, 'tasks', id), { order: index });
    });
    await batch.commit();
  }, [uid]);

  const moveTasks = useCallback(async (taskIds, targetCategory) => {
    if (!uid) return;
    const batch = writeBatch(db);
    const existingInTarget = tasks.filter(t => t.category === targetCategory);
    const baseOrder = existingInTarget.length > 0
      ? Math.max(...existingInTarget.map(t => t.order)) + 1
      : 0;
    taskIds.forEach((id, i) => {
      batch.update(doc(db, 'users', uid, 'tasks', id), {
        category: targetCategory,
        order: baseOrder + i,
      });
    });
    await batch.commit();
  }, [uid, tasks]);

  const deleteTasks = useCallback(async (taskIds) => {
    if (!uid) return;
    const batch = writeBatch(db);
    taskIds.forEach(id => {
      batch.delete(doc(db, 'users', uid, 'tasks', id));
    });
    await batch.commit();
  }, [uid]);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    reorderTasks,
    moveTasks,
    deleteTasks,
    deleteAllCalendarTasks,
    deleteAllFutureTasks,
  };
}
