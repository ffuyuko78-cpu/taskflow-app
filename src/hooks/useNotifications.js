import { useState, useEffect, useCallback } from 'react';

const NOTIF_STORAGE_KEY = 'taskflow_notif_sent_date';

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function checkAndNotify(tasks) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const tomorrow = getTomorrow();
  const soon = tasks.filter(t => {
    if (t.completed) return false;
    const due = t.dueDate || (t.category === 'future' ? t.date : null);
    return due === tomorrow;
  });

  if (soon.length === 0) return;

  const today = new Date().toISOString().slice(0, 10);
  const lastSent = localStorage.getItem(NOTIF_STORAGE_KEY);
  if (lastSent === today) return;

  soon.forEach(task => {
    new Notification('タスク管理アプリ — 明日が期限のタスク', {
      body: `「${task.text}」の期限は明日です`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    });
  });
  localStorage.setItem(NOTIF_STORAGE_KEY, today);
}

export function useNotifications(tasks, loading) {
  const [dueSoonTasks, setDueSoonTasks] = useState([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [checked, setChecked] = useState(false);

  // Request notification permission on first load
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check for due-soon tasks once after initial load
  useEffect(() => {
    if (loading || checked) return;
    setChecked(true);

    const tomorrow = getTomorrow();
    const soon = tasks.filter(t => {
      if (t.completed) return false;
      const due = t.dueDate || (t.category === 'future' ? t.date : null);
      return due === tomorrow;
    });
    setDueSoonTasks(soon);
    checkAndNotify(tasks);
  }, [loading, tasks, checked]);

  // Re-check every hour (catches the case where the page stays open)
  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => {
      const tomorrow = getTomorrow();
      const soon = tasks.filter(t => {
        if (t.completed) return false;
        const due = t.dueDate || (t.category === 'future' ? t.date : null);
        return due === tomorrow;
      });
      setDueSoonTasks(soon);
      checkAndNotify(tasks);
    }, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [loading, tasks]);

  const dismissBanner = useCallback(() => setBannerDismissed(true), []);

  return {
    dueSoonTasks,
    showBanner: dueSoonTasks.length > 0 && !bannerDismissed,
    dismissBanner,
  };
}
