import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleCalendarProvider } from '../firebase';

// 今日から30日分のカレンダーイベントを取得する
export function useGoogleCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    setEvents([]);

    try {
      // カレンダースコープ付きでGoogle再認証
      const result = await signInWithPopup(auth, googleCalendarProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) throw new Error('アクセストークンを取得できませんでした');

      // 今日から30日分を取得
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
      setEvents(data.items || []);
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // ユーザーがキャンセル → エラー表示しない
      } else {
        setError(err.message || 'カレンダーの取得に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  // イベントの開始日（文字列 YYYY-MM-DD）を返すユーティリティ
  const getEventDate = (event) => {
    const raw = event.start?.dateTime || event.start?.date;
    if (!raw) return null;
    return raw.substring(0, 10); // YYYY-MM-DD
  };

  // 今日かどうか
  const isToday = (dateStr) => {
    const today = new Date().toISOString().substring(0, 10);
    return dateStr === today;
  };

  return { events, loading, error, fetchEvents, getEventDate, isToday };
}
