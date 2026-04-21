import { useState } from 'react';
import { todayStr } from '../utils/dateUtils';

export function EndModal({ tasks, appDate, onClose, onEnd }) {
  const completedToday = tasks.filter(t => t.completed);
  const remaining = tasks.filter(t => t.category === 'today' && !t.completed);
  const [reflection, setReflection] = useState('');
  const [copied, setCopied] = useState(false);

  const generateText = () => {
    const lines = [];
    lines.push(`📅 ${appDate} の振り返り`);
    lines.push('');
    if (completedToday.length > 0) {
      lines.push('✅ 完了したタスク：');
      completedToday.forEach(t => lines.push(`  • ${t.text}`));
      lines.push('');
    }
    if (remaining.length > 0) {
      lines.push('📌 持ち越し：');
      remaining.forEach(t => lines.push(`  • ${t.text}`));
      lines.push('');
    }
    if (reflection.trim()) {
      lines.push('💭 振り返り：');
      lines.push(reflection.trim());
    }
    return lines.join('\n');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnd = () => {
    onEnd({
      completedTaskIds: completedToday.map(t => t.id),
      remainingTaskIds: remaining.map(t => t.id),
      reflection,
      newDate: todayStr(),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🌙 今日を終える</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {completedToday.length > 0 ? (
            <div className="summary-section">
              <p className="modal-label">✅ 完了タスク（{completedToday.length}件）</p>
              <div className="summary-list">
                {completedToday.map(t => (
                  <div key={t.id} className="summary-item completed-item">
                    <span>✓</span> {t.text}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="modal-empty">完了タスクはありません</p>
          )}

          {remaining.length > 0 && (
            <div className="summary-section">
              <p className="modal-label">📌 持ち越しタスク（{remaining.length}件）→ 明日以降へ</p>
              <div className="summary-list">
                {remaining.map(t => (
                  <div key={t.id} className="summary-item">
                    {t.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="modal-comment">
            <label className="modal-label">振り返りメモ（任意）</label>
            <textarea
              className="reflection-input"
              placeholder="今日の振り返り、感想、明日への一言など..."
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              rows={3}
            />
          </div>

          <button className="btn-copy" onClick={handleCopy}>
            {copied ? '✓ コピーしました！' : '📋 投稿用テキストをコピー'}
          </button>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>キャンセル</button>
          <button className="btn-danger" onClick={handleEnd}>
            🌙 今日を終了
          </button>
        </div>
      </div>
    </div>
  );
}
