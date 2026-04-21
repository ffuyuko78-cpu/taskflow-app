// カレンダー同期ユーティリティ
// - インポート済みイベントIDをFirestoreで管理（重複防止）
// - アクセストークンをsessionStorageにキャッシュ（同セッション中は再認証不要）

import {
  collection, doc, setDoc, getDocs, writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

const TOKEN_KEY = 'gcal_token';
const TOKEN_EXPIRY_KEY = 'gcal_token_expiry';

// アクセストークンをsessionStorageに保存
export function saveToken(token) {
  const expiry = Date.now() + 55 * 60 * 1000; // 55分後（Googleは60分）
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
}

// sessionStorageから有効なトークンを取得（期限切れならnull）
export function getCachedToken() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiry = Number(sessionStorage.getItem(TOKEN_EXPIRY_KEY));
  if (!token || !expiry || Date.now() > expiry) return null;
  return token;
}

// トークンをクリア
export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
}

// Firestoreからインポート済みイベントIDを取得
export async function getImportedEventIds(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'calendarImported'));
  return new Set(snap.docs.map(d => d.id));
}

// Firestoreにインポート済みとしてマーク
export async function markEventsImported(uid, eventIds) {
  if (eventIds.length === 0) return;
  const batch = writeBatch(db);
  eventIds.forEach(id => {
    batch.set(doc(db, 'users', uid, 'calendarImported', id), {
      importedAt: new Date().toISOString(),
    });
  });
  await batch.commit();
}

// Googleカレンダーから今日〜30日先のイベントを取得
export async function fetchCalendarEvents(accessToken) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const future = new Date(now);
  future.setDate(future.getDate() + 30);

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    orderBy: 'startTime',
    singleEvents: 'true',
    maxResults: '50',
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'カレンダーの取得に失敗しました');
  }

  const data = await res.json();
  return data.items || [];
}

// イベントの日付文字列（YYYY-MM-DD）を返す
export function getEventDate(event) {
  const raw = event.start?.dateTime || event.start?.date;
  return raw ? raw.substring(0, 10) : null;
}

// イベントの時刻文字列（HH:MM）を返す（終日は空文字）
export function getEventTime(event) {
  const dt = event.start?.dateTime;
  if (!dt) return '';
  const d = new Date(dt);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// イベントをタスク形式に変換
// 形式: 「4/26（日） 09:30 タイトル」
export function eventToTask(event) {
  const dateStr = getEventDate(event);
  const today = new Date().toISOString().substring(0, 10);
  const category = dateStr === today ? 'today' : 'future';
  const time = getEventTime(event);

  // 日付表示「4/26（日）」
  const d = new Date(dateStr + 'T00:00:00');
  const dow = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  const dateDisplay = `${d.getMonth() + 1}/${d.getDate()}（${dow}）`;

  const text = time
    ? `${dateDisplay} ${time} ${event.summary}`
    : `${dateDisplay} ${event.summary}`;

  return { text, category, dueDate: dateStr, calendarEventId: event.id };
}
