// v2.3 - Mobile signInWithRedirect support
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

// モバイル判定
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
import { useAppDate } from './hooks/useAppDate';
import { useTasks } from './hooks/useTasks';
import { useNotifications } from './hooks/useNotifications';
import { useAutoCalendarSync } from './hooks/useAutoCalendarSync';
import { Header } from './components/Header';
import { TaskColumn } from './components/TaskColumn';
import { StartModal } from './components/StartModal';
import { EndModal } from './components/EndModal';
import { NotificationBanner } from './components/NotificationBanner';

function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError('ログインに失敗しました。もう一度お試しください。');
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-title">✅ タスク管理アプリ</h1>
        <p className="login-subtitle">シンプルな毎日のタスク管理</p>
        <button
          className="google-login-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? '接続中...' : (
            <>
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Googleでログイン
            </>
          )}
        </button>
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

function TaskBoard({ user }) {
  const { appDate, setAppDate } = useAppDate(user.uid);
  const {
    tasks, loading, addTask, updateTask, deleteTask, toggleComplete, reorderTasks, moveTasks, deleteTasks, deleteDuplicates
  } = useTasks(user.uid);
  const { dueSoonTasks, showBanner, dismissBanner } = useNotifications(tasks, loading);

  // 自動カレンダー同期
  const { syncing, syncMessage, needsAuth, syncWithAuth, resetAndResync } = useAutoCalendarSync(user.uid, addTask);

  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [dedupeMessage, setDedupeMessage] = useState('');

  // 「明日以降」の今日の日付タスクを「今日」に自動移動
  useEffect(() => {
    if (!tasks.length || loading) return;
    const today = new Date().toISOString().slice(0, 10);
    const toMove = tasks.filter(t =>
      t.category === 'future' && (t.date === today || t.dueDate === today)
    );
    if (toMove.length > 0) {
      moveTasks(toMove.map(t => t.id), 'today');
    }
  }, [tasks, loading]);

  const handleDeduplication = async () => {
    const count = await deleteDuplicates();
    if (count > 0) {
      setDedupeMessage(`🗑️ ${count}件の重複を削除しました`);
    } else {
      setDedupeMessage('重複はありませんでした');
    }
    setTimeout(() => setDedupeMessage(''), 3000);
  };

  const handleStartConfirm = async ({ keepTaskIds, moveToFutureIds, newDate }) => {
    if (moveToFutureIds.length > 0) {
      await moveTasks(moveToFutureIds, 'future');
    }
    await setAppDate(newDate);
  };

  const handleEndConfirm = async ({ completedTaskIds, remainingTaskIds, newDate }) => {
    if (completedTaskIds.length > 0) {
      await deleteTasks(completedTaskIds);
    }
    if (remainingTaskIds.length > 0) {
      await moveTasks(remainingTaskIds, 'future');
    }
    await setAppDate(newDate);
  };

  return (
    <div className="app-layout">
      <Header
        user={user}
        appDate={appDate}
        onStartClick={() => setShowStart(true)}
        onEndClick={() => setShowEnd(true)}
        onDateChange={setAppDate}
        onCalendarClick={needsAuth ? syncWithAuth : null}
        calendarSyncing={syncing}
        onCalendarReset={resetAndResync}
        onDeduplication={handleDeduplication}
      />

      {/* カレンダー同期メッセージ */}
      {syncMessage && (
        <div className="sync-message">{syncMessage}</div>
      )}
      {dedupeMessage && (
        <div className="sync-message">{dedupeMessage}</div>
      )}

      {/* カレンダー連携ボタン（初回のみ表示） */}
      {needsAuth && !syncing && (
        <div className="calendar-sync-banner">
          <span>📅 Googleカレンダーの新しい予定を自動で追加します</span>
          <button className="calendar-sync-btn" onClick={syncWithAuth}>
            カレンダーを連携する
          </button>
        </div>
      )}

      {/* 同期中表示 */}
      {syncing && (
        <div className="sync-message" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
          ⏳ カレンダーを同期中...
        </div>
      )}

      {showBanner && (
        <NotificationBanner tasks={dueSoonTasks} onDismiss={dismissBanner} />
      )}

      <main className="board">
        {['daily', 'today', 'future'].map(cat => (
          <TaskColumn
            key={cat}
            category={cat}
            tasks={tasks.filter(t => t.category === cat)}
            onAdd={addTask}
            onToggle={toggleComplete}
            onDelete={deleteTask}
            onUpdate={updateTask}
            onReorder={reorderTasks}
          />
        ))}
      </main>

      {showStart && (
        <StartModal
          tasks={tasks}
          onClose={() => setShowStart(false)}
          onStart={handleStartConfirm}
        />
      )}

      {showEnd && (
        <EndModal
          tasks={tasks}
          appDate={appDate}
          onClose={() => setShowEnd(false)}
          onEnd={handleEndConfirm}
        />
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;
  return <TaskBoard user={user} />;
}
