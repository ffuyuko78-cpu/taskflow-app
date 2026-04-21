export function NotificationBanner({ tasks, onDismiss }) {
  return (
    <div className="notif-banner">
      <span className="notif-icon">⏰</span>
      <div className="notif-body">
        <strong className="notif-title">期限が明日のタスク（{tasks.length}件）</strong>
        <ul className="notif-list">
          {tasks.map(t => (
            <li key={t.id}>{t.text}</li>
          ))}
        </ul>
      </div>
      <button className="notif-dismiss" onClick={onDismiss} aria-label="閉じる">×</button>
    </div>
  );
}
