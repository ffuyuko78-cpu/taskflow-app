// 自動カレンダー同期フック（Firestore直接操作版）
import { useState, useEffect, useCallback } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { auth, googleCalendarProvider, db } from '../firebase';
import {
  getCachedToken, saveToken, clearToken,
  fetchCalendarEvents, markEventsImported, eventToTask,
} from '../utils/calendarSync';

export function useAutoCalendarSync(uid, addTask) {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);

  // Firestoreから直接「明日以降」タスクを全削除
  const deleteAllFutureTasksDirect = useCallback(async () => {
    if (!uid) return;
    const snap = await getDocs(
      query(collection(db, 'users', uid, 'tasks'), where('category', '==', 'future'))
    );
    if (snap.docs.length === 0) return;
    // Firestoreは1バッチ500件まで
    const chunks = [];
    for (let i = 0; i < snap.docs.length; i += 400) {
      chunks.push(snap.docs.slice(i, i + 400));
    }
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  }, [uid]);

  // calendarImportedコレクションをクリア
  const clearImportedCollection = useCallback(async () => {
    if (!uid) return;
    const snap = await getDocs(collection(db, 'users', uid, 'calendarImported'));
    if (snap.docs.length === 0) return;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }, [uid]);

  // 実際の同期処理（カレンダーから取得して追加）
  const doSync = useCallback(async (accessToken) => {
    if (!uid) return 0;
    setSyncing(true);
    setSyncMessage('');
    try {
      // インポート済みIDを取得
      const importedSnap = await getDocs(collection(db, 'users', uid, 'calendarImported'));
      const importedIds = new Set(importedSnap.docs.map(d => d.id));

      // 既存タスクのcalendarEventIdを取得（重複防止）
      const taskSnap = await getDocs(
        query(collection(db, 'users', uid, 'tasks'), where('calendarEventId', '!=', null))
      );
      const existingIds = new Set(taskSnap.docs.map(d => d.data().calendarEventId));

      // カレンダーイベントを取得
      const events = await fetchCalendarEvents(accessToken);

      // 新しいイベントだけ抽出
      const newEvents = events.filter(e =>
        e.id && e.summary &&
        !importedIds.has(e.id) &&
        !existingIds.has(e.id)
      );

      if (newEvents.length === 0) {
        setSyncMessage('新しい予定はありません');
        setTimeout(() => setSyncMessage(''), 3000);
        return 0;
      }

      for (const event of newEvents) {
        const task = eventToTask(event);
        await addTask(task.category, task.text, null, task.dueDate, task.calendarEventId);
      }

      await markEventsImported(uid, newEvents.map(e => e.id));

      setSyncMessage(`📅 ${newEvents.length}件の予定を追加しました`);
      setTimeout(() => setSyncMessage(''), 4000);
      return newEvents.length;
    } catch (err) {
      clearToken();
      setNeedsAuth(true);
      return 0;
    } finally {
      setSyncing(false);
    }
  }, [uid, addTask]);

  // 起動時：キャッシュトークンで自動同期
  useEffect(() => {
    if (!uid) return;
    const token = getCachedToken();
    if (token) {
      doSync(token);
    } else {
      setNeedsAuth(true);
    }
  }, [uid]); // eslint-disable-line

  // 連携ボタンを押したとき（Googleポップアップ）
  const syncWithAuth = useCallback(async () => {
    setSyncing(true);
    setNeedsAuth(false);
    try {
      const result = await signInWithPopup(auth, googleCalendarProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (!token) throw new Error('トークン取得失敗');
      saveToken(token);
      await doSync(token);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setSyncMessage('同期に失敗しました');
        setTimeout(() => setSyncMessage(''), 3000);
      }
      setNeedsAuth(true);
      setSyncing(false);
    }
  }, [doSync]);

  // 完全リセット：明日以降を全削除 → カレンダーから入れ直す
  const resetAndResync = useCallback(async () => {
    if (!uid) return;
    setSyncing(true);
    setSyncMessage('削除中...');
    try {
      // Firestoreから直接削除
      await deleteAllFutureTasksDirect();
      setSyncMessage('再取り込み中...');
      await clearImportedCollection();

      // 再同期
      const token = getCachedToken();
      if (token) {
        await doSync(token);
      } else {
        setSyncing(false);
        setNeedsAuth(true);
        setSyncMessage('');
      }
    } catch (err) {
      setSyncMessage('失敗しました。もう一度お試しください');
      setTimeout(() => setSyncMessage(''), 4000);
      setSyncing(false);
    }
  }, [uid, deleteAllFutureTasksDirect, clearImportedCollection, doSync]);

  return { syncing, syncMessage, needsAuth, syncWithAuth, resetAndResync };
}
