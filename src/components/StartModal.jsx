import { useState } from 'react';
import { todayStr } from '../utils/dateUtils';

export function StartModal({ tasks, onClose, onStart }) {
  const todayTasks = tasks.filter(t => t.category === 'today' && !t.completed);
  const [selected, setSelected] = useState(new Set(todayTasks.map(t => t.id)));
  const [comment, setComment] = useState('');

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleStart = () => {
    onStart({
      keepTaskIds: [...selected],
      moveToFutureIds: todayTasks.filter(t => !selected.has(t.id)).map(t => t.id),
      comment,
      newDate: todayStr(),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>☀️ 今日を始める</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {todayTasks.length > 0 ? (
            <>
              <p className="modal-label">引き継ぐタスクを選んでください：</p>
              <div className="task-check-list">
                {todayTasks.map(task => (
                  <label key={task.id} className="task-check-item">
                    <input
                      type="checkbox"
                      checked={selected.has(task.id)}
                      onChange={() => toggle(task.id)}
                    />
                    <span>{task.text}</span>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <p className="modal-empty">前回の「今日」タスクはありません</p>
          )}

          <div className="modal-comment">
            <label className="modal-label">一言コメント（任意）</label>
            <input
              className="comment-input"
              placeholder="今日の意気込みなど..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>キャンセル</button>
          <button className="btn-primary" onClick={handleStart}>
            🚀 今日スタート
          </button>
        </div>
      </div>
    </div>
  );
}
